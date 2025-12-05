import { Suspense } from 'react';
import { ProductGrid, ProductFilters } from '@/components/products';
import prisma from '@/lib/prisma';
import type { ProductFilters as Filters, ProductListItem } from '@/types';

interface SearchParams {
  page?: string;
  limit?: string;
  platform?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  search?: string;
}

async function getProducts(params: SearchParams): Promise<{
  products: ProductListItem[];
  total: number;
}> {
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '20');
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    isActive: true,
  };

  if (params.platform) {
    where.platform = params.platform;
  }

  if (params.category) {
    where.category = { slug: params.category };
  }

  if (params.minPrice || params.maxPrice) {
    where.price = {};
    if (params.minPrice) {
      (where.price as Record<string, number>).gte = parseFloat(params.minPrice);
    }
    if (params.maxPrice) {
      (where.price as Record<string, number>).lte = parseFloat(params.maxPrice);
    }
  }

  if (params.search) {
    where.OR = [
      { title: { contains: params.search } },
      { brand: { contains: params.search } },
    ];
  }

  let orderBy: Record<string, string> = { createdAt: 'desc' };
  switch (params.sort) {
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
    products: products.map((p) => ({
      ...p,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
    })),
    total,
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { products, total } = await getProducts(searchParams);
  const page = parseInt(searchParams.page || '1');
  const limit = parseInt(searchParams.limit || '20');
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Browse Products</h1>
        <p className="text-gray-600 mt-2">
          {total} products from Lazada and Shopee
        </p>
      </div>

      <Suspense fallback={<div>Loading filters...</div>}>
        <ProductFilters />
      </Suspense>

      <ProductGrid products={products} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const pageNum = i + 1;
            const isActive = pageNum === page;
            return (
              <a
                key={pageNum}
                href={`/products?page=${pageNum}${
                  searchParams.search ? `&search=${searchParams.search}` : ''
                }${
                  searchParams.platform
                    ? `&platform=${searchParams.platform}`
                    : ''
                }${searchParams.sort ? `&sort=${searchParams.sort}` : ''}`}
                className={`px-4 py-2 rounded-lg ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {pageNum}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
