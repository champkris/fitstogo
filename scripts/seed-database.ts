import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'women-tops' },
      update: {},
      create: { name: 'Women Tops', slug: 'women-tops' },
    }),
    prisma.category.upsert({
      where: { slug: 'women-dresses' },
      update: {},
      create: { name: 'Women Dresses', slug: 'women-dresses' },
    }),
    prisma.category.upsert({
      where: { slug: 'men-shirts' },
      update: {},
      create: { name: 'Men Shirts', slug: 'men-shirts' },
    }),
    prisma.category.upsert({
      where: { slug: 'outerwear' },
      update: {},
      create: { name: 'Outerwear', slug: 'outerwear' },
    }),
  ]);

  console.log(`Created ${categories.length} categories`);

  // Create sample products
  const sampleProducts = [
    {
      externalId: 'lzd-001',
      platform: 'LAZADA' as const,
      title: 'Elegant Summer Floral Dress - Casual Beach Style',
      description: 'Beautiful floral print dress perfect for summer occasions.',
      price: 599,
      originalPrice: 899,
      imageUrl: 'https://placehold.co/400x600/fce7f3/be185d?text=Floral+Dress',
      affiliateUrl: 'https://lazada.co.th/products/sample-1',
      categoryId: categories[1].id,
      brand: 'SummerStyle',
      rating: 4.5,
      reviewCount: 128,
    },
    {
      externalId: 'lzd-002',
      platform: 'LAZADA' as const,
      title: 'Classic White Blouse - Office Wear Collection',
      description: 'Elegant white blouse suitable for office and formal occasions.',
      price: 450,
      originalPrice: 550,
      imageUrl: 'https://placehold.co/400x600/f0f9ff/0369a1?text=White+Blouse',
      affiliateUrl: 'https://lazada.co.th/products/sample-2',
      categoryId: categories[0].id,
      brand: 'OfficeLady',
      rating: 4.2,
      reviewCount: 89,
    },
    {
      externalId: 'shp-001',
      platform: 'SHOPEE' as const,
      title: 'Korean Style Oversized T-Shirt - Unisex Fashion',
      description: 'Trendy oversized t-shirt with minimalist design.',
      price: 299,
      originalPrice: 399,
      imageUrl: 'https://placehold.co/400x600/f5f5f4/44403c?text=Oversized+Tee',
      affiliateUrl: 'https://shopee.co.th/products/sample-1',
      categoryId: categories[0].id,
      brand: 'KoreanStyle',
      rating: 4.7,
      reviewCount: 256,
    },
    {
      externalId: 'shp-002',
      platform: 'SHOPEE' as const,
      title: 'Men Premium Cotton Shirt - Business Casual',
      description: 'High quality cotton shirt for the modern professional.',
      price: 699,
      originalPrice: 899,
      imageUrl: 'https://placehold.co/400x600/eff6ff/1d4ed8?text=Cotton+Shirt',
      affiliateUrl: 'https://shopee.co.th/products/sample-2',
      categoryId: categories[2].id,
      brand: 'GentleMan',
      rating: 4.4,
      reviewCount: 167,
    },
    {
      externalId: 'lzd-003',
      platform: 'LAZADA' as const,
      title: 'Winter Wool Coat - Elegant Long Design',
      description: 'Warm and stylish wool coat for cold weather.',
      price: 1899,
      originalPrice: 2499,
      imageUrl: 'https://placehold.co/400x600/fef3c7/d97706?text=Wool+Coat',
      affiliateUrl: 'https://lazada.co.th/products/sample-3',
      categoryId: categories[3].id,
      brand: 'WinterWarm',
      rating: 4.8,
      reviewCount: 45,
    },
    {
      externalId: 'shp-003',
      platform: 'SHOPEE' as const,
      title: 'Casual Denim Jacket - Vintage Wash Style',
      description: 'Classic denim jacket with vintage wash finish.',
      price: 799,
      originalPrice: 999,
      imageUrl: 'https://placehold.co/400x600/dbeafe/2563eb?text=Denim+Jacket',
      affiliateUrl: 'https://shopee.co.th/products/sample-3',
      categoryId: categories[3].id,
      brand: 'DenimCo',
      rating: 4.3,
      reviewCount: 198,
    },
  ];

  for (const product of sampleProducts) {
    await prisma.product.upsert({
      where: {
        externalId_platform: {
          externalId: product.externalId,
          platform: product.platform,
        },
      },
      update: product,
      create: {
        ...product,
        sizes: {
          create: [
            { size: 'S', stockStatus: 'in_stock' },
            { size: 'M', stockStatus: 'in_stock' },
            { size: 'L', stockStatus: 'in_stock' },
            { size: 'XL', stockStatus: 'low_stock' },
          ],
        },
      },
    });
  }

  console.log(`Created ${sampleProducts.length} sample products`);

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
