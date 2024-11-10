// app/api/payments/success/route.ts
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const externalReference = searchParams.get('external_reference');

  if (!externalReference) {
    return NextResponse.redirect(
      new URL('/payment/error', req.url)
    );
  }

  // Solo redirigir, el webhook se encargará de actualizar el estado
  return NextResponse.redirect(
    new URL(`/payment/success?ticketId=${externalReference}`, req.url)
  );
}