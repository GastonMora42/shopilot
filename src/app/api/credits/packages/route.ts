// app/api/credits/packages/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { CreditPackage } from '@/app/models/Credit';

export async function GET() {
  try {
    await dbConnect();
    
    const packages = await CreditPackage.find({ isActive: true });
    if (!packages || packages.length === 0) {
      return NextResponse.json(
        { error: 'No hay paquetes disponibles' },
        { status: 404 }
      );
    }

    return NextResponse.json(packages);
  } catch (error) {
    console.error('Error al obtener paquetes:', error);
    return NextResponse.json(
      { error: 'Error al obtener paquetes' },
      { status: 500 }
    );
  }
}