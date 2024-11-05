// src/app/api/auth/mercadopago/callback/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { User } from '@/app/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.redirect('/dashboard/settings?error=no_code');
  }

  try {
    // Obtener tokens de MP
    const response = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_secret: process.env.MP_CLIENT_SECRET,
        client_id: process.env.MP_CLIENT_ID,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/mercadopago/callback`,
      }),
    });

    const data = await response.json();

    // Obtener sesión del usuario actual
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.redirect('/login?error=no_session');
    }

    // Guardar tokens en la base de datos
    await dbConnect();
    await User.findOneAndUpdate(
      { email: session.user.email },
      {
        'mercadopago.accessToken': data.access_token,
        'mercadopago.refreshToken': data.refresh_token,
        'mercadopago.userId': data.user_id,
        'mercadopago.publicKey': data.public_key,
      }
    );

    return NextResponse.redirect('/dashboard/settings?success=true');
  } catch (error) {
    console.error('MP OAuth error:', error);
    return NextResponse.redirect('/dashboard/settings?error=oauth_failed');
  }
}