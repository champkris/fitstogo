import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';

const prisma = new PrismaClient();

// Clothing categories to import
const CLOTHING_CATEGORIES = new Set([
  'Women Clothes',
  'Men Clothes',
  'Baby & Kids Fashion',
  'Women Shoes',
  'Men Shoes',
  'Muslim Fashion',
]);

// Map Shopee categories to our categories
const CATEGORY_MAP: Record<string, string> = {
  'Women Clothes': 'women',
  'Men Clothes': 'men',
  'Baby & Kids Fashion': 'kids',
  'Women Shoes': 'women',
  'Men Shoes': 'men',
  'Muslim Fashion': 'women',
};

// Common Thai color names
const THAI_COLORS: Record<string, string> = {
  'ดำ': 'Black',
  'ดํา': 'Black',
  'สีดำ': 'Black',
  'สีดํา': 'Black',
  'ขาว': 'White',
  'สีขาว': 'White',
  'แดง': 'Red',
  'สีแดง': 'Red',
  'น้ำเงิน': 'Navy',
  'สีน้ำเงิน': 'Navy',
  'ฟ้า': 'Blue',
  'สีฟ้า': 'Blue',
  'เขียว': 'Green',
  'สีเขียว': 'Green',
  'เขียวเข้ม': 'Dark Green',
  'สีเขียวเข้ม': 'Dark Green',
  'เหลือง': 'Yellow',
  'สีเหลือง': 'Yellow',
  'ส้ม': 'Orange',
  'สีส้ม': 'Orange',
  'ชมพู': 'Pink',
  'สีชมพู': 'Pink',
  'ม่วง': 'Purple',
  'สีม่วง': 'Purple',
  'น้ำตาล': 'Brown',
  'สีน้ำตาล': 'Brown',
  'เทา': 'Gray',
  'สีเทา': 'Gray',
  'กากี': 'Khaki',
  'สีกากี': 'Khaki',
  'ครีม': 'Cream',
  'สีครีม': 'Cream',
  'เบจ': 'Beige',
  'สีเบจ': 'Beige',
  'กรม': 'Navy',
  'สีกรม': 'Navy',
  'กรมท่า': 'Navy',
};

// Size patterns
const SIZE_PATTERN = /^(XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|5XL|Free Size|FREE SIZE|\d{2,3})$/i;

interface ShopeeProduct {
  title: string;
  description: string;
  price: string;
  sale_price: string;
  image_link: string;
  additional_image_link: string;
  global_category1: string;
  global_category2: string;
  global_category3: string;
  itemid: string;
  shopid: string;
  shop_name: string;
  item_rating: string;
  item_sold: string;
  stock: string;
  product_link: string;
  'product_short link': string;
  global_brand: string;
  discount_percentage: string;
  model_names: string;
  model_prices: string;
  model_ids: string;
}

interface ParsedVariant {
  name: string;
  color: string | null;
  size: string | null;
  price: number;
  externalId: string | null;
}

function parseVariants(row: ShopeeProduct): ParsedVariant[] {
  const variants: ParsedVariant[] = [];

  if (!row.model_names) {
    return variants;
  }

  const names = row.model_names.split('|');
  const prices = row.model_prices ? row.model_prices.split('|') : [];
  const ids = row.model_ids ? row.model_ids.split('|') : [];

  for (let i = 0; i < names.length; i++) {
    const name = names[i].trim();
    if (!name) continue;

    const price = parseFloat(prices[i]) || parseFloat(row.sale_price || row.price) || 0;
    const externalId = ids[i]?.trim() || null;

    // Parse color and size from variant name
    let color: string | null = null;
    let size: string | null = null;

    // Try to split by comma (common format: "สีขาว,M" or "White,L")
    const parts = name.split(',').map(p => p.trim());

    for (const part of parts) {
      // Check if it's a size
      if (SIZE_PATTERN.test(part)) {
        size = part.toUpperCase();
        continue;
      }

      // Check if it's a Thai color
      const thaiColor = THAI_COLORS[part];
      if (thaiColor) {
        color = thaiColor;
        continue;
      }

      // Check if it's an English color
      const lowerPart = part.toLowerCase();
      if (['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown', 'gray', 'grey', 'navy', 'beige', 'cream', 'khaki'].includes(lowerPart)) {
        color = part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        continue;
      }

      // If single part and no color/size found yet, try to determine what it is
      if (parts.length === 1) {
        // Check if it contains a Thai color keyword
        for (const [thai, english] of Object.entries(THAI_COLORS)) {
          if (part.includes(thai)) {
            color = english;
            break;
          }
        }
      }
    }

    variants.push({
      name,
      color,
      size,
      price,
      externalId,
    });
  }

  return variants;
}

function extractUniqueSizes(variants: ParsedVariant[]): string[] {
  const sizes = new Set<string>();
  for (const v of variants) {
    if (v.size) {
      sizes.add(v.size);
    }
  }
  return Array.from(sizes);
}

function extractUniqueColors(variants: ParsedVariant[]): string[] {
  const colors = new Set<string>();
  for (const v of variants) {
    if (v.color) {
      colors.add(v.color);
    }
  }
  return Array.from(colors);
}

async function main() {
  const csvPath = path.join(
    process.cwd(),
    'docs/shopee/1006_200101_Product Feed All Global Category_20251205T070433_1.csv'
  );

  console.log('Setting up categories...');

  // Ensure categories exist
  const categoryData = [
    { slug: 'women', name: 'Women' },
    { slug: 'men', name: 'Men' },
    { slug: 'kids', name: 'Kids' },
    { slug: 'accessories', name: 'Accessories' },
  ];

  for (const cat of categoryData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // Get category IDs
  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));

  // Delete existing Shopee products (cascades to sizes and variants)
  console.log('Clearing existing Shopee products...');
  await prisma.productVariant.deleteMany({
    where: { product: { platform: 'SHOPEE' } },
  });
  await prisma.productSize.deleteMany({
    where: { product: { platform: 'SHOPEE' } },
  });
  await prisma.product.deleteMany({
    where: { platform: 'SHOPEE' },
  });

  console.log('Reading CSV file with streaming...');

  const MAX_PRODUCTS = 2000;
  let processed = 0;
  let imported = 0;

  interface ProductData {
    product: any;
    variants: ParsedVariant[];
    sizes: string[];
    colors: string[];
  }

  const productsToImport: ProductData[] = [];

  // Stream and collect products
  await new Promise<void>((resolve, reject) => {
    const parser = fs
      .createReadStream(csvPath)
      .pipe(
        parse({
          columns: true,
          skip_empty_lines: true,
          relax_quotes: true,
          relax_column_count: true,
        })
      );

    parser.on('data', (row: ShopeeProduct) => {
      processed++;

      if (!CLOTHING_CATEGORIES.has(row.global_category1)) {
        return;
      }

      if (!row.title || !row.price || !row.image_link || !row.product_link) {
        return;
      }

      if (imported >= MAX_PRODUCTS) {
        parser.destroy();
        return;
      }

      const categorySlug = CATEGORY_MAP[row.global_category1] || 'women';
      const categoryId = categoryMap.get(categorySlug);

      const price = parseFloat(row.sale_price || row.price) || 0;
      const originalPrice = parseFloat(row.price) || price;
      const rating = parseFloat(row.item_rating) || null;
      const reviewCount = parseInt(row.item_sold) || 0;

      // Parse variants
      const variants = parseVariants(row);
      const sizes = extractUniqueSizes(variants);
      const colors = extractUniqueColors(variants);

      // If no sizes found, add default sizes
      if (sizes.length === 0) {
        sizes.push('S', 'M', 'L', 'XL');
      }

      productsToImport.push({
        product: {
          externalId: row.itemid,
          platform: 'SHOPEE',
          title: row.title.slice(0, 500),
          description: (row.description || '').slice(0, 5000),
          price,
          originalPrice: originalPrice > price ? originalPrice : null,
          imageUrl: row.image_link,
          images: row.additional_image_link
            ? row.additional_image_link.split(',').filter(Boolean).slice(0, 10)
            : [],
          affiliateUrl: row['product_short link'] || row.product_link,
          categoryId,
          brand: row.global_brand || null,
          rating,
          reviewCount,
          isActive: true,
        },
        variants,
        sizes,
        colors,
      });

      imported++;

      if (imported % 500 === 0) {
        console.log(`Collected ${imported} clothing products (processed ${processed} total)...`);
      }
    });

    parser.on('end', () => resolve());
    parser.on('error', reject);
    parser.on('close', () => resolve());
  });

  console.log(`\nCollected ${productsToImport.length} products. Inserting into database...`);

  // Insert products in batches
  const BATCH_SIZE = 100;
  for (let i = 0; i < productsToImport.length; i += BATCH_SIZE) {
    const batch = productsToImport.slice(i, i + BATCH_SIZE);
    await prisma.product.createMany({
      data: batch.map(p => p.product),
      skipDuplicates: true,
    });
    console.log(`Inserted ${Math.min(i + BATCH_SIZE, productsToImport.length)} / ${productsToImport.length} products`);
  }

  // Get all inserted products for creating sizes and variants
  console.log('\nFetching inserted products...');
  const dbProducts = await prisma.product.findMany({
    where: { platform: 'SHOPEE' },
    select: { id: true, externalId: true },
  });

  const productIdMap = new Map(dbProducts.map(p => [p.externalId, p.id]));

  // Create sizes and variants
  console.log('Creating product sizes and variants...');
  let sizesCreated = 0;
  let variantsCreated = 0;

  for (const data of productsToImport) {
    const productId = productIdMap.get(data.product.externalId);
    if (!productId) continue;

    // Create sizes
    for (const size of data.sizes) {
      try {
        await prisma.productSize.create({
          data: {
            productId,
            size,
            inStock: true,
          },
        });
        sizesCreated++;
      } catch {
        // Ignore duplicates
      }
    }

    // Create variants
    for (const variant of data.variants) {
      try {
        await prisma.productVariant.create({
          data: {
            productId,
            externalId: variant.externalId,
            name: variant.name.slice(0, 255),
            color: variant.color,
            size: variant.size,
            price: variant.price,
            inStock: true,
          },
        });
        variantsCreated++;
      } catch {
        // Ignore duplicates
      }
    }

    if ((sizesCreated + variantsCreated) % 2000 === 0) {
      console.log(`Created ${sizesCreated} sizes, ${variantsCreated} variants...`);
    }
  }

  console.log(`\nCreated ${sizesCreated} product sizes`);
  console.log(`Created ${variantsCreated} product variants`);

  // Summary
  console.log(`\n=== Import Complete ===`);
  console.log(`Products: ${productsToImport.length}`);
  console.log(`Sizes: ${sizesCreated}`);
  console.log(`Variants: ${variantsCreated}`);

  const summary = await prisma.product.groupBy({
    by: ['platform'],
    _count: true,
  });
  console.log('\nProducts by platform:');
  for (const s of summary) {
    console.log(`  ${s.platform}: ${s._count}`);
  }

  // Sample variants
  console.log('\nSample variants:');
  const sampleVariants = await prisma.productVariant.findMany({
    take: 10,
    include: { product: { select: { title: true } } },
  });
  for (const v of sampleVariants) {
    console.log(`  ${v.product.title.slice(0, 40)}... | ${v.name} | Color: ${v.color || '-'} | Size: ${v.size || '-'}`);
  }
}

main()
  .catch((e) => {
    console.error('Import error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
