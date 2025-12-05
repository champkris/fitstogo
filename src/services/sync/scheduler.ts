import prisma from '@/lib/prisma';
import { syncLazadaProducts, syncShopeeProducts } from '../affiliate';
import type { Platform } from '@prisma/client';

export async function runProductSync(platform: Platform): Promise<void> {
  // Create sync log
  const syncLog = await prisma.syncLog.create({
    data: {
      platform,
      status: 'started',
    },
  });

  try {
    const result =
      platform === 'LAZADA'
        ? await syncLazadaProducts()
        : await syncShopeeProducts();

    // Update sync log
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: result.success ? 'completed' : 'failed',
        productsCount: result.productsCount,
        errorMessage: result.errors.join('\n') || null,
        completedAt: new Date(),
      },
    });

    console.log(
      `Sync completed for ${platform}: ${result.productsCount} products`
    );
  } catch (error) {
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    });

    throw error;
  }
}

export async function runAllSyncs(): Promise<void> {
  console.log('Starting product sync for all platforms...');

  await Promise.allSettled([
    runProductSync('LAZADA'),
    runProductSync('SHOPEE'),
  ]);

  console.log('Product sync completed');
}
