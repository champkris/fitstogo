import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCached } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;
    const platform = searchParams.get('platform');
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort');
    const search = searchParams.get('search');

    const cacheKey = `products:${JSON.stringify({
      page,
      limit,
      platform,
      category,
      minPrice,
      maxPrice,
      sort,
      search,
    })}`;

    const result = await getCached(
      cacheKey,
      async () => {
        const where: Record<string, unknown> = { isActive: true };

        if (platform) {
          where.platform = platform;
        }

        if (category) {
          where.category = { slug: category };
        }

        if (minPrice || maxPrice) {
          where.price = {};
          if (minPrice) {
            (where.price as Record<string, number>).gte = parseFloat(minPrice);
          }
          if (maxPrice) {
            (where.price as Record<string, number>).lte = parseFloat(maxPrice);
          }
        }

        if (search) {
          where.OR = [
            { title: { contains: search } },
            { brand: { contains: search } },
          ];
        }

        let orderBy: Record<string, string> = { createdAt: 'desc' };
        switch (sort) {
          case 'price_asc':
            orderBy = { price: 'asc' };
            break;
          case 'price_desc':
            orderBy = { price: 'desc' };
            break;
          case 'rating':
            orderBy = { rating: 'desc' };
            break;
          case 'newest':
            orderBy = { createdAt: 'desc' };
            break;
        }

        const [products, total] = await Promise.all([
          prisma.product.findMany({
            where,
            orderBy,
            skip,
            take: limit,
            select: {
              id: true,
              title: true,
              price: true,
              originalPrice: true,
              imageUrl: true,
              platform: true,
              rating: true,
              reviewCount: true,
              brand: true,
            },
          }),
          prisma.product.count({ where }),
        ]);

        return {
          data: products.map((p) => ({
            ...p,
            price: Number(p.price),
            originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
          })),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        };
      },
      300 // 5 minutes cache
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Products fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
