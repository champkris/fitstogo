import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateTryOn, isKieAiConfigured } from '@/lib/kie-ai';
import { describeClothing, isGLMConfigured } from '@/lib/glm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const history = searchParams.get('history') === 'true';

    if (history) {
      const sessions = await prisma.tryOnSession.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          product: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
            },
          },
        },
      });

      return NextResponse.json(sessions);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('TryOn fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch try-on sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId, userPhotoId, garmentImageUrl, maskRegion } = await request.json();

    if (!productId || !userPhotoId) {
      return NextResponse.json(
        { error: 'Product ID and photo ID are required' },
        { status: 400 }
      );
    }

    // Check subscription limits
    const [subscription, monthlyCount] = await Promise.all([
      prisma.subscription.findUnique({
        where: { userId: session.user.id },
      }),
      prisma.tryOnSession.count({
        where: {
          userId: session.user.id,
          createdAt: {
            gte: new Date(new Date().setDate(1)), // First of month
          },
        },
      }),
    ]);

    const maxTryOns =
      subscription?.planType === 'PREMIUM'
        ? -1 // unlimited
        : subscription?.planType === 'BASIC'
        ? 50
        : 5;

    if (maxTryOns !== -1 && monthlyCount >= maxTryOns) {
      return NextResponse.json(
        { error: `Monthly try-on limit reached. Maximum ${maxTryOns} try-ons.` },
        { status: 400 }
      );
    }

    // Verify product and photo exist
    const [product, photo] = await Promise.all([
      prisma.product.findUnique({ where: { id: productId } }),
      prisma.userPhoto.findFirst({
        where: { id: userPhotoId, userId: session.user.id },
      }),
    ]);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Create try-on session
    const tryOnSession = await prisma.tryOnSession.create({
      data: {
        userId: session.user.id,
        productId,
        userPhotoId,
        status: 'PROCESSING',
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
        userPhoto: true,
      },
    });

    // Use custom garment image URL if provided, otherwise use product's main image
    const finalGarmentUrl = garmentImageUrl || product.imageUrl;

    // Process with Kie.ai
    if (isKieAiConfigured()) {
      // Run async - don't await to return response quickly
      (async () => {
        try {
          // First, get clothing description from GLM if configured
          let clothingDescription: string | undefined;
          if (isGLMConfigured()) {
            console.log('Getting clothing description from GLM...');
            clothingDescription = await describeClothing(finalGarmentUrl);
            console.log('Clothing description:', clothingDescription);
          }

          // Then generate try-on with the description and mask region
          const result = await generateTryOn(photo.photoUrl, finalGarmentUrl, clothingDescription, maskRegion);

          if (result.success && result.imageUrl) {
            await prisma.tryOnSession.update({
              where: { id: tryOnSession.id },
              data: {
                status: 'COMPLETED',
                resultUrl: result.imageUrl,
              },
            });
          } else {
            await prisma.tryOnSession.update({
              where: { id: tryOnSession.id },
              data: {
                status: 'FAILED',
                errorMsg: result.error || 'AI processing failed',
              },
            });
          }
        } catch (error) {
          console.error('Kie.ai try-on error:', error);
          await prisma.tryOnSession.update({
            where: { id: tryOnSession.id },
            data: {
              status: 'FAILED',
              errorMsg: error instanceof Error ? error.message : 'Processing failed',
            },
          });
        }
      })();
    } else {
      // Fallback: just show product image if Kie.ai not configured
      await prisma.tryOnSession.update({
        where: { id: tryOnSession.id },
        data: {
          status: 'COMPLETED',
          resultUrl: product.imageUrl,
        },
      });
    }

    return NextResponse.json(tryOnSession, { status: 201 });
  } catch (error) {
    console.error('TryOn create error:', error);
    return NextResponse.json(
      { error: 'Failed to create try-on session' },
      { status: 500 }
    );
  }
}
