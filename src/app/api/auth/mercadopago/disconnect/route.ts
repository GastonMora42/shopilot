// src/app/api/auth/mercadopago/disconnect/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import { User } from '@/app/models/User';

export async function POST() {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Conectar a la base de datos
    await dbConnect();

    // Revocar el access token en MercadoPago si existe
    if (session.user.mercadopago?.accessToken) {
      try {
        await fetch('https://api.mercadopago.com/oauth/revoke', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.user.mercadopago.accessToken}`
          }
        });
      } catch (error) {
        console.error('Error al revocar token en MP:', error);
        // Continuamos con la desconexión local incluso si falla la revocación en MP
      }
    }

    // Actualizar el usuario en MongoDB
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $unset: {
          mercadopago: 1  // Elimina todo el objeto mercadopago
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Cuenta de MercadoPago desconectada exitosamente"
    });

  } catch (error) {
    console.error("Error al desconectar MP:", error);
    return NextResponse.json(
      { 
        error: "Error al desconectar la cuenta",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}