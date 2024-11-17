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

    // Verificar sesión y rol
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.redirect(
        new URL('/auth/signin', req.url)
      );
    }

    // Verificar que el usuario sea un organizador
    if (session.user.role !== 'ORGANIZER') {
      return NextResponse.redirect(
        new URL('/admin/settings?error=unauthorized_role', req.url)
      );
    }

    await dbConnect();

    // Verificar si el usuario existe en la base de datos
    const existingUser = await User.findOne({ email: session.user.email });
    if (!existingUser) {
      return NextResponse.redirect(
        new URL('/admin/settings?error=user_not_found', req.url)
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

    // Verificar que los datos necesarios estén presentes
    if (!mpData.access_token || !mpData.user_id) {
      console.error('Datos incompletos de MP:', mpData);
      return NextResponse.redirect(
        new URL('/admin/settings?error=incomplete_mp_data', req.url)
      );
    }

    // Verificar que la cuenta MP no esté ya conectada a otro usuario
    const existingMPUser = await User.findOne({
      'mercadopago.userId': mpData.user_id,
      email: { $ne: session.user.email }
    });

    if (existingMPUser) {
      return NextResponse.redirect(
        new URL('/admin/settings?error=mp_account_already_connected', req.url)
      );
    }

    // Guardar datos en la base de datos
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
        new URL('/admin/settings?error=update_failed', req.url)
      );
    }

    // Verificar la conexión con MP haciendo una llamada de prueba
    try {
      const testResponse = await fetch('https://api.mercadopago.com/users/me', {
        headers: {
          'Authorization': `Bearer ${mpData.access_token}`
        }
      });

      if (!testResponse.ok) {
        throw new Error('Failed to verify MP connection');
      }
    } catch (error) {
      console.error('Error verificando conexión MP:', error);
      // Continuamos aunque falle la verificación
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