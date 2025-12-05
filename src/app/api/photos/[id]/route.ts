import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { deleteFile } from '@/lib/storage';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const photo = await prisma.userPhoto.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Delete from storage
    try {
      const key = photo.photoUrl.split('/').slice(-2).join('/');
      await deleteFile(key);
    } catch (error) {
      console.error('Failed to delete from storage:', error);
    }

    // Delete from database
    await prisma.userPhoto.delete({
      where: { id: params.id },
    });

    // If this was the default photo, set another as default
    if (photo.isDefault) {
      const nextPhoto = await prisma.userPhoto.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
      });

      if (nextPhoto) {
        await prisma.userPhoto.update({
          where: { id: nextPhoto.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Photo delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const photo = await prisma.userPhoto.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Set all photos as not default, then set this one as default
    await prisma.$transaction([
      prisma.userPhoto.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      }),
      prisma.userPhoto.update({
        where: { id: params.id },
        data: { isDefault: true },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Photo update error:', error);
    return NextResponse.json(
      { error: 'Failed to update photo' },
      { status: 500 }
    );
  }
}
