export interface AffiliateProduct {
  externalId: string;
  title: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  currency: string;
  imageUrl: string;
  images: string[];
  affiliateUrl: string;
  category: string;
  brand: string | null;
  rating: number | null;
  reviewCount: number;
  sizes: { size: string; stockStatus: string }[];
}

export interface AffiliateApiConfig {
  apiKey: string;
  apiSecret: string;
  affiliateId: string;
  baseUrl: string;
}

export interface SyncResult {
  success: boolean;
  productsCount: number;
  errors: string[];
}
