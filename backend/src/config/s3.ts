import { S3Client } from '@aws-sdk/client-s3';

export const createS3Client = (accessKeyId: string, secretAccessKey: string, region: string, endpoint: string) => {
  return new S3Client({
    region: region || 'auto',
    endpoint: endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    }
  });
};

export const S3_CONFIG = {
  BUCKET_NAME: 'blogger',
  REGION: 'auto',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ],
  PUBLIC_URL_PREFIX: 'https://pub-4960f18fba834252a9a3562a3fc94bef.r2.dev'
}; 