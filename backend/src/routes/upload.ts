import { Hono } from "hono";
import { PutObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { verify } from 'hono/jwt';
import { createS3Client, S3_CONFIG } from '../config/s3';

interface CustomBindings {
  Bindings: {
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_REGION: string;
    AWS_BUCKET_NAME: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: number;
  };
}

export const uploadRouter = new Hono<CustomBindings>();

const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header("authorization") || "";
  const token = authHeader.split(" ")[1];
  
  if (!token) {
    return c.json({ 
      success: false, 
      error: "No token provided" 
    }, 401);
  }

  try {
    const user = await verify(token, c.env.JWT_SECRET);
    if (user && user.id) {
      c.set('userId', user.id);
      await next();
    } else {
      return c.json({ 
        success: false, 
        error: "Invalid token" 
      }, 401);
    }
  } catch (e: any) {
    return c.json({ 
      success: false, 
      error: "Authentication failed" 
    }, 401);
  }
};

uploadRouter.post("/image", authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const formData = await c.req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return c.json({
        success: false,
        error: "No image file provided"
      }, 400);
    }

    if (!S3_CONFIG.ALLOWED_MIME_TYPES.includes(file.type)) {
      return c.json({
        success: false,
        error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."
      }, 400);
    }

    // Validate file size
    if (file.size > S3_CONFIG.MAX_FILE_SIZE) {
      return c.json({
        success: false,
        error: "File too large. Maximum size is 5MB."
      }, 400);
    }

    const s3Client = createS3Client(
      c.env.AWS_ACCESS_KEY_ID,
      c.env.AWS_SECRET_ACCESS_KEY,
      c.env.AWS_REGION || S3_CONFIG.REGION
    ) as S3Client;

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop();
    const fileName = `blog-images/${userId}/${timestamp}-${randomString}.${fileExtension}`;

    const buffer = await file.arrayBuffer();

    const uploadCommand = new PutObjectCommand({
      Bucket: c.env.AWS_BUCKET_NAME || S3_CONFIG.BUCKET_NAME,
      Key: fileName,
      Body: new Uint8Array(buffer),
      ContentType: file.type,
      ContentDisposition: 'inline',
      CacheControl: 'max-age=31536000', 
    });

    await s3Client.send(uploadCommand);

    const bucketName = c.env.AWS_BUCKET_NAME || S3_CONFIG.BUCKET_NAME;
    const region = c.env.AWS_REGION || S3_CONFIG.REGION;
    
    const publicUrl = `https://s3.${region}.amazonaws.com/${bucketName}/${fileName}`;

    return c.json({
      success: true,
      data: {
        url: publicUrl,
        fileName: fileName,
        fileSize: file.size,
        mimeType: file.type
      },
      message: "Image uploaded successfully"
    });

  } catch (error: any) {
    console.error("Image upload error:", error);
    return c.json({
      success: false,
      error: "Failed to upload image"
    }, 500);
  }
});

uploadRouter.delete("/image", authMiddleware, async (c) => {
  try {
    const { fileName } = await c.req.json();
    const userId = c.get('userId');

    if (!fileName) {
      return c.json({
        success: false,
        error: "File name is required"
      }, 400);
    }

    // Verify the file belongs to the user
    if (!fileName.includes(`blog-images/${userId}/`)) {
      return c.json({
        success: false,
        error: "Unauthorized to delete this file"
      }, 403);
    }

    // Create S3 client
    const s3Client = createS3Client(
      c.env.AWS_ACCESS_KEY_ID,
      c.env.AWS_SECRET_ACCESS_KEY,
      c.env.AWS_REGION || S3_CONFIG.REGION
    ) as S3Client;

    // Delete from S3
    const deleteCommand = new DeleteObjectCommand({
      Bucket: c.env.AWS_BUCKET_NAME || S3_CONFIG.BUCKET_NAME,
      Key: fileName,
    });

    await s3Client.send(deleteCommand);

    return c.json({
      success: true,
      message: "Image deleted successfully"
    });

  } catch (error: any) {
    console.error("Image delete error:", error);
    return c.json({
      success: false,
      error: "Failed to delete image"
    }, 500);
  }
}); 