// app/api/payments/success/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('payment_id');
    const status = searchParams.get('status');
    const externalReference = searchParams.get('external_reference');

    if (status === 'approved' && externalReference) {
      await dbConnect();

      const ticket = await Ticket.findById(externalReference);
      if (ticket && ticket.status === 'PENDING') {
        ticket.status = 'PAID';
        ticket.paymentId = paymentId;
        await ticket.save();
        console.log('Ticket actualizado a PAID por URL de retorno:', externalReference);
      }
    }

    // Redirigir a la página de éxito
    return NextResponse.redirect(
      new URL(`/payment/success?ticketId=${externalReference}`, req.url)
    );

  } catch (error) {
    console.error('Error procesando pago:', error);
    return NextResponse.redirect(
      new URL('/payment/error', req.url)
    );
  }
}