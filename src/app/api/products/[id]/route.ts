import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCached } from '@/lib/redis';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const product = await getCached(
      `product:${id}`,
      async () => {
        const p = await prisma.product.findUnique({
          where: { id },
          include: {
            sizes: true,
            category: true,
          },
        });

        if (!p) return null;

        return {
          ...p,
          price: Number(p.price),
          originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
          images: (p.images as string[]) || [],
        };
      },
      600 // 10 minutes cache
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Product fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
