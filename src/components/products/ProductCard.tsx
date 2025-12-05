'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui';
import { formatPrice, getDiscountPercentage } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { ProductListItem } from '@/types';

interface ProductCardProps {
  product: ProductListItem;
}

const platformStyles: Record<string, { bg: string; text: string; label: string }> = {
  SHOPEE: { bg: 'bg-orange-500', text: 'text-white', label: 'Shopee' },
  LAZADA: { bg: 'bg-blue-600', text: 'text-white', label: 'Lazada' },
  TIKTOK: { bg: 'bg-black', text: 'text-white', label: 'TikTok' },
};

export default function ProductCard({ product }: ProductCardProps) {
  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? getDiscountPercentage(product.originalPrice, product.price)
      : null;

  const platform = platformStyles[product.platform] || {
    bg: 'bg-gray-500',
    text: 'text-white',
    label: product.platform
  };

  return (
    <Card className="group overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-[3/4] bg-gray-100">
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {discount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
              -{discount}%
            </div>
          )}
          <div className={cn(
            'absolute top-2 right-2 text-xs font-medium px-2 py-1 rounded shadow-sm',
            platform.bg,
            platform.text
          )}>
            {platform.label}
          </div>
          <button
            className="absolute bottom-2 right-2 bg-primary-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `/tryon?product=${product.id}`;
            }}
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">
          {product.brand && (
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              {product.brand}
            </p>
          )}
          <h3 className="font-medium text-gray-900 line-clamp-2 text-sm mb-2">
            {product.title}
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="ml-2 text-sm text-gray-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            {product.rating && (
              <div className="flex items-center text-sm text-gray-500">
                <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                <span>{product.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
}
