import prisma from '@/lib/prisma';
import { uploadFile, generateTryOnKey } from '@/lib/storage';
import { processVirtualTryOn } from './gemini';

export async function processTryOnSession(sessionId: string): Promise<void> {
  try {
    // Get session with related data
    const session = await prisma.tryOnSession.findUnique({
      where: { id: sessionId },
      include: {
        userPhoto: true,
        product: true,
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Update status to processing
    await prisma.tryOnSession.update({
      where: { id: sessionId },
      data: { status: 'PROCESSING' },
    });

    // Determine product type
    const productType = inferProductType(session.product.title);

    // Process virtual try-on
    const result = await processVirtualTryOn({
      userPhotoUrl: session.userPhoto.photoUrl,
      productImageUrl: session.product.imageUrl,
      productType,
    });

    // Update session with result
    await prisma.tryOnSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        resultUrl: result.resultUrl,
      },
    });
  } catch (error) {
    console.error('Try-on processing error:', error);

    await prisma.tryOnSession.update({
      where: { id: sessionId },
      data: {
        status: 'FAILED',
        errorMsg: error instanceof Error ? error.message : 'Processing failed',
      },
    });
  }
}

function inferProductType(
  title: string
): 'top' | 'bottom' | 'dress' | 'outerwear' {
  const lowerTitle = title.toLowerCase();

  if (
    lowerTitle.includes('dress') ||
    lowerTitle.includes('gown') ||
    lowerTitle.includes('jumpsuit')
  ) {
    return 'dress';
  }

  if (
    lowerTitle.includes('jacket') ||
    lowerTitle.includes('coat') ||
    lowerTitle.includes('blazer') ||
    lowerTitle.includes('cardigan')
  ) {
    return 'outerwear';
  }

  if (
    lowerTitle.includes('pants') ||
    lowerTitle.includes('jeans') ||
    lowerTitle.includes('skirt') ||
    lowerTitle.includes('shorts') ||
    lowerTitle.includes('trousers')
  ) {
    return 'bottom';
  }

  return 'top';
}
