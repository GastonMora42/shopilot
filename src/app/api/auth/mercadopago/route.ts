// src/app/api/auth/mercadopago/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  
  // URL de tu aplicación registrada en MercadoPago
  const clientId = process.env.MP_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/mercadopago/callback`;

  // Redirigir al usuario a la página de autorización de MercadoPago
  const authUrl = `https://auth.mercadopago.com.ar/authorization?client_id=${clientId}&response_type=code&platform_id=mp&redirect_uri=${redirectUri}`;
  
  return NextResponse.redirect(authUrl);
}
