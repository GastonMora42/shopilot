// src/app/api/credits/update-image/route.ts
import { NextResponse } from 'next/server';
import { CreditPackage } from '@/app/models/Credit';
import dbConnect from '@/app/lib/mongodb';

export async function PUT(req: Request) {
  try {
    await dbConnect();
    const { packageId, imageUrl } = await req.json();

    const updatedPackage = await CreditPackage.findByIdAndUpdate(
      packageId,
      { imageUrl },
      { new: true }
    );

    if (!updatedPackage) {
      return NextResponse.json(
        { error: 'Paquete no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedPackage);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al actualizar la imagen' },
      { status: 500 }
    );
  }
}