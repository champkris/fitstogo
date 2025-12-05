import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { productId } = params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        affiliateUrl: true,
        platform: true,
      },
    });

    if (!product) {
      return NextResponse.redirect(new URL('/products', request.url));
    }

    // Track click
    await prisma.clickTracking.create({
      data: {
        productId,
        platform: product.platform,
        userId: session?.user?.id || null,
        ipAddress: request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown',
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    // Redirect to affiliate URL
    return NextResponse.redirect(product.affiliateUrl);
  } catch (error) {
    console.error('Redirect error:', error);
    return NextResponse.redirect(new URL('/products', request.url));
  }
}
