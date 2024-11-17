// src/app/api/auth/mercadopago/callback/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import { User } from '@/app/models/User';

export async function GET(req: Request) {
  try {
    // Obtener el código de autorización de la URL
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(
        new URL('/admin/settings?error=no_code', req.url)
      );
    }

    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.redirect(
        new URL('/auth/signin', req.url)
      );
    }

    // Obtener access token de MP
    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_secret: process.env.MP_CLIENT_SECRET,
        client_id: process.env.MP_CLIENT_ID,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/mercadopago/callback`
      })
    });

    if (!tokenResponse.ok) {
      console.error('Error MP:', await tokenResponse.text());
      return NextResponse.redirect(
        new URL('/admin/settings?error=mp_error', req.url)
      );
    }

    const mpData = await tokenResponse.json();

    // Conectar a la base de datos
    await dbConnect();

    // Verificar si la cuenta MP ya está conectada a otro usuario
    const existingMPUser = await User.findOne({
      'mercadopago.userId': mpData.user_id,
      email: { $ne: session.user.email }
    });

    if (existingMPUser) {
      return NextResponse.redirect(
        new URL('/admin/settings?error=mp_account_already_connected', req.url)
      );
    }

    // Actualizar o reconectar la cuenta del usuario actual
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        mercadopago: {
          accessToken: mpData.access_token,
          refreshToken: mpData.refresh_token,
          userId: mpData.user_id,
          publicKey: mpData.public_key
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.redirect(
        new URL('/admin/settings?error=user_not_found', req.url)
      );
    }

    // Redirigir a la página de configuración con éxito
    return NextResponse.redirect(
      new URL('/admin/settings?success=true', req.url)
    );

  } catch (error) {
    console.error('Error en callback MP:', error);
    return NextResponse.redirect(
      new URL('/admin/settings?error=unknown', req.url)
    );
  }
}