import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { uploadFile, generatePhotoKey } from '@/lib/storage';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const photos = await prisma.userPhoto.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(photos);
  } catch (error) {
    console.error('Photos fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const photoType = (formData.get('photoType') as string) || 'FULL_BODY';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check subscription limits
    const [subscription, photoCount] = await Promise.all([
      prisma.subscription.findUnique({
        where: { userId: session.user.id },
      }),
      prisma.userPhoto.count({
        where: { userId: session.user.id },
      }),
    ]);

    const maxPhotos =
      subscription?.planType === 'PREMIUM'
        ? 20
        : subscription?.planType === 'BASIC'
        ? 5
        : 1;

    if (photoCount >= maxPhotos) {
      return NextResponse.json(
        { error: `Photo limit reached. Maximum ${maxPhotos} photos allowed.` },
        { status: 400 }
      );
    }

    // Upload file
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = generatePhotoKey(session.user.id, file.name);
    const photoUrl = await uploadFile(key, buffer, file.type);

    // Check if this is the first photo
    const isFirst = photoCount === 0;

    const photo = await prisma.userPhoto.create({
      data: {
        userId: session.user.id,
        photoUrl,
        photoType: photoType as 'FULL_BODY' | 'UPPER_BODY' | 'LOWER_BODY',
        isDefault: isFirst,
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}
