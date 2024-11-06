// src/app/api/payments/failure/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const externalReference = searchParams.get('external_reference');

    if (!externalReference) {
      return NextResponse.redirect(
        new URL('/payment/error', req.url)
      );
    }

    await dbConnect();

    // Buscar y actualizar el ticket
    const ticket = await Ticket.findById(externalReference);
    if (ticket) {
      ticket.status = 'PENDING'; // o podrías usar 'FAILED' si agregas ese estado
      await ticket.save();
    }

    // Redirigir a la página de error de pago
    return NextResponse.redirect(
      new URL(`/payment/error?ticketId=${externalReference}`, req.url)
    );

  } catch (error) {
    console.error('Error en el proceso de pago fallido:', error);
    return NextResponse.redirect(
      new URL('/payment/error', req.url)
    );
  }
}