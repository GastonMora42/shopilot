// src/app/api/payments/success/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('payment_id');
    const status = searchParams.get('status');
    const externalReference = searchParams.get('external_reference');

    if (!paymentId || !status || !externalReference) {
      return NextResponse.redirect(
        new URL('/payment/error', req.url)
      );
    }

    await dbConnect();

    // Buscar y actualizar el ticket
    const ticket = await Ticket.findById(externalReference);
    if (!ticket) {
      console.error('Ticket no encontrado:', externalReference);
      return NextResponse.redirect(
        new URL('/payment/error', req.url)
      );
    }

    // Actualizar el ticket
    ticket.status = 'PAID';
    ticket.paymentId = paymentId;
    await ticket.save();

    // Redirigir a la página de éxito con el ID del ticket
    return NextResponse.redirect(
      new URL(`/payment/success?ticketId=${ticket._id}`, req.url)
    );

  } catch (error) {
    console.error('Error en el proceso de pago exitoso:', error);
    return NextResponse.redirect(
      new URL('/payment/error', req.url)
    );
  }
}