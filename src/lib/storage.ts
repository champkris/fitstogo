import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';

// Check if using real DO Spaces credentials
const USE_LOCAL_STORAGE =
  !process.env.DO_SPACES_KEY ||
  process.env.DO_SPACES_KEY === 'dummy' ||
  process.env.NODE_ENV === 'development';

const s3Client = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT,
  region: process.env.DO_SPACES_REGION || 'sgp1',
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY || '',
    secretAccessKey: process.env.DO_SPACES_SECRET || '',
  },
  forcePathStyle: false,
});

const BUCKET = process.env.DO_SPACES_BUCKET || 'fitstogo';

export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  if (USE_LOCAL_STORAGE) {
    // Save to local public/uploads directory for development
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadDir, key);
    const dirPath = path.dirname(filePath);

    // Ensure directory exists
    await mkdir(dirPath, { recursive: true });

    // Write file
    await writeFile(filePath, body);

    // Return local URL
    return `/uploads/${key}`;
  }

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: 'public-read',
    })
  );

  return `${process.env.DO_SPACES_ENDPOINT}/${BUCKET}/${key}`;
}

export async function deleteFile(key: string): Promise<void> {
  if (USE_LOCAL_STORAGE) {
    const filePath = path.join(process.cwd(), 'public', 'uploads', key);
    try {
      await unlink(filePath);
    } catch {
      // File may not exist
    }
    return;
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  if (USE_LOCAL_STORAGE) {
    // For local dev, just return the upload endpoint
    return `/api/photos/upload?key=${encodeURIComponent(key)}`;
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  if (USE_LOCAL_STORAGE) {
    return `/uploads/${key}`;
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export function generatePhotoKey(userId: string, filename: string): string {
  const ext = filename.split('.').pop();
  const timestamp = Date.now();
  return `photos/${userId}/${timestamp}.${ext}`;
}

export function generateTryOnKey(sessionId: string): string {
  return `tryon/${sessionId}.png`;
}
