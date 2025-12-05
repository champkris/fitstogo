import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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

    const { productId, userPhotoId } = await request.json();

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
        status: 'PENDING',
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

    // TODO: Trigger AI processing (queue job for Gemini API)
    // For now, simulate processing
    setTimeout(async () => {
      try {
        // In production, this would call Google Gemini Nano API
        // and generate the actual try-on result
        await prisma.tryOnSession.update({
          where: { id: tryOnSession.id },
          data: {
            status: 'COMPLETED',
            resultUrl: product.imageUrl, // Placeholder - would be actual result
          },
        });
      } catch (error) {
        console.error('TryOn processing error:', error);
        await prisma.tryOnSession.update({
          where: { id: tryOnSession.id },
          data: {
            status: 'FAILED',
            errorMsg: 'Processing failed',
          },
        });
      }
    }, 3000);

    return NextResponse.json(tryOnSession, { status: 201 });
  } catch (error) {
    console.error('TryOn create error:', error);
    return NextResponse.json(
      { error: 'Failed to create try-on session' },
      { status: 500 }
    );
  }
}
