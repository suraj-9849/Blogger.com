import { S3Client } from '@aws-sdk/client-s3';

export const createS3Client = (accessKeyId: string, secretAccessKey: string, region: string) => {
  return new S3Client({
    region: region,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    }
  });
};

export const S3_CONFIG = {
  BUCKET_NAME: 'blogger-s3',
  REGION: 'eu-north-1',
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
}; 