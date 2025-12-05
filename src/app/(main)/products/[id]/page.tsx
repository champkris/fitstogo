import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star, ExternalLink, Sparkles, ChevronRight } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import ProductImageGallery from '@/components/products/ProductImageGallery';
import { formatPrice, getDiscountPercentage } from '@/lib/utils';
import prisma from '@/lib/prisma';

interface Props {
  params: { id: string };
}

async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      sizes: true,
      category: true,
    },
  });

  if (!product) return null;

  return {
    ...product,
    price: Number(product.price),
    originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
    images: (product.images as string[]) || [],
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? getDiscountPercentage(product.originalPrice, product.price)
      : null;

  const allImages = [product.imageUrl, ...product.images];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-500 mb-6">
        <Link href="/products" className="hover:text-gray-700">
          Products
        </Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        {product.category && (
          <>
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-gray-700"
            >
              {product.category.name}
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
          </>
        )}
        <span className="text-gray-900 truncate max-w-xs">{product.title}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <ProductImageGallery images={allImages} title={product.title} />

        {/* Product Info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded">
              {product.platform}
            </span>
            {product.brand && (
              <span className="text-gray-500 text-sm">{product.brand}</span>
            )}
          </div>

          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
            {product.title}
          </h1>

          {product.rating && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="ml-1 font-medium">{product.rating.toFixed(1)}</span>
              </div>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">
                {product.reviewCount} reviews
              </span>
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <>
                  <span className="text-xl text-gray-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="bg-red-100 text-red-700 text-sm font-semibold px-2 py-0.5 rounded">
                    -{discount}%
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Sizes */}
          {product.sizes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Available Sizes
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <span
                    key={size.id}
                    className={`px-4 py-2 border rounded-lg text-sm ${
                      size.stockStatus === 'out_of_stock'
                        ? 'border-gray-200 text-gray-400 line-through'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    {size.size}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Link href={`/tryon?product=${product.id}`} className="flex-1">
              <Button className="w-full" size="lg">
                <Sparkles className="w-5 h-5 mr-2" />
                Virtual Try-On
              </Button>
            </Link>
            <Link
              href={`/api/redirect/${product.id}`}
              target="_blank"
              className="flex-1"
            >
              <Button variant="outline" className="w-full" size="lg">
                <ExternalLink className="w-5 h-5 mr-2" />
                Buy on {product.platform}
              </Button>
            </Link>
          </div>

          {/* Description */}
          {product.description && (
            <Card>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
