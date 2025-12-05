import { Platform, PhotoType, TryOnStatus, PlanType } from '@prisma/client';

export type { Platform, PhotoType, TryOnStatus, PlanType };

export interface ProductListItem {
  id: string;
  title: string;
  price: number;
  originalPrice: number | null;
  imageUrl: string;
  platform: Platform;
  rating: number | null;
  reviewCount: number | null;
  brand: string | null;
}

export interface ProductDetail extends ProductListItem {
  description: string | null;
  images: string[];
  affiliateUrl: string;
  sizes: ProductSize[];
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface ProductSize {
  id: string;
  size: string;
  stockStatus: string;
  measurements: Record<string, string> | null;
}

export interface UserPhoto {
  id: string;
  photoUrl: string;
  photoType: PhotoType;
  isDefault: boolean;
  createdAt: Date;
}

export interface TryOnResult {
  id: string;
  resultUrl: string | null;
  status: TryOnStatus;
  product: {
    id: string;
    title: string;
    imageUrl: string;
  };
  createdAt: Date;
}

export interface UserSubscription {
  planType: PlanType;
  status: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  platform?: Platform;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
