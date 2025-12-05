import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tryOnSession = await prisma.tryOnSession.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
        userPhoto: true,
      },
    });

    if (!tryOnSession) {
      return NextResponse.json(
        { error: 'Try-on session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(tryOnSession);
  } catch (error) {
    console.error('TryOn fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch try-on session' },
      { status: 500 }
    );
  }
}
