// src/app/api/user/bank-account/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '@/app/lib/mongodb';
import { User } from '@/app/models/User';
import { authOptions } from '@/app/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const { accountName, cbu, bank, additionalNotes } = await req.json();
    
    // Validar datos
    if (!accountName || !cbu || !bank) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // Actualizar usuario
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    user.bankAccount = {
      accountName,
      cbu,
      bank,
      additionalNotes: additionalNotes || ''
    };
    
    await user.save();
    
    return NextResponse.json({
      success: true,
      message: 'Datos bancarios actualizados correctamente'
    });
    
  } catch (error) {
    console.error('Error al guardar datos bancarios:', error);
    
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}