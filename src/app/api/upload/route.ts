// app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from '@/app/lib/s3Config';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    // Log inicial
    console.log('Starting upload process to S3...');
    
    // Log de variables de entorno (sin mostrar valores completos)
    console.log('Environment check:', {
      hasBucket: !!process.env.AWS_S3_BUCKET,
      hasRegion: !!process.env.AWS_REGION,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
    });

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.log('No file received in request');
      return NextResponse.json(
        { error: 'No se subió ningún archivo' },
        { status: 400 }
      );
    }

    // Log de información del archivo
    console.log('File received:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    if (!S3_BUCKET) {
      throw new Error('S3 bucket name not configured');
    }

    const fileName = `events/${uuidv4()}-${file.name.replace(/\s+/g, '-')}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    console.log('Preparing S3 upload:', {
      bucket: S3_BUCKET,
      fileName,
      fileSize: buffer.length
    });

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    });

    console.log('Sending file to S3...');
    await s3Client.send(command);
    console.log('File uploaded successfully to S3');

    const fileUrl = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    return NextResponse.json({ 
      success: true,
      url: fileUrl 
    });

  } catch (error) {
    // Log detallado del error
    console.error('Error in upload process:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Verificar si es un error de AWS
    if (error instanceof Error && error.message.includes('AWS')) {
      console.error('AWS Error:', error);
      return NextResponse.json(
        { error: 'Error de configuración de AWS' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Error al subir el archivo',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}