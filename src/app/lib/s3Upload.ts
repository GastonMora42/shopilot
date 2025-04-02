// src/app/lib/s3Upload.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function uploadToS3(fileBuffer: Buffer, fileName: string) {
  const uniqueFileName = `transfers/${uuidv4()}-${fileName}`;
  
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: uniqueFileName,
    Body: fileBuffer,
    ContentType: 'image/jpeg',
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    return `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}