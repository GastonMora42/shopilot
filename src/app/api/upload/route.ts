// app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from '@/app/lib/s3Config';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No se subió ningún archivo' },
        { status: 400 }
      );
    }
    // Validaciones
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido' },
        { status: 400 }
      );
    }


    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Archivo demasiado grande' },
        { status: 400 }
      );
    }

    const fileName = `events/${uuidv4()}-${file.name.replace(/\s+/g, '-')}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    console.log('Attempting to upload:', {
      bucket: S3_BUCKET,
      region: process.env.AWS_REGION,
      fileName,
      fileType: file.type
    });

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read',
    });

    await s3Client.send(command);

    const fileUrl = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    
    console.log('Upload successful:', fileUrl);

    return NextResponse.json({ 
      success: true,
      url: fileUrl 
    });

  } catch (error) {
    console.error('Error detallado:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al subir el archivo' },
      { status: 500 }
    );
  }
}