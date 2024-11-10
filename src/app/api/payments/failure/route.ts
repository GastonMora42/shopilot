// src/app/api/payments/failure/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

const payment = new Payment(client);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('payment_id');
    const status = searchParams.get('collection_status');
    const externalReference = searchParams.get('external_reference');

    console.log('Failure callback recibido:', {
      paymentId,
      status,
      externalReference
    });

    if (!externalReference) {
      console.error('Falta external_reference en failure callback');
      return NextResponse.redirect(
        new URL('/payment/error', req.url)
      );
    }

    await dbConnect();
    const session = await (await dbConnect()).startSession();

    try {
      await session.withTransaction(async () => {
        // Buscar el ticket
        const ticket = await Ticket.findById(externalReference)
          .session(session);

        if (!ticket) {
          console.error('Ticket no encontrado en failure callback');
          return;
        }

        console.log('Ticket encontrado:', {
          id: ticket._id,
          currentStatus: ticket.status
        });

        // Solo actualizar si el ticket está en PENDING
        if (ticket.status === 'PENDING') {
          // Liberar los asientos
          await Seat.updateMany(
            {
              eventId: ticket.eventId,
              number: { $in: ticket.seats }
            },
            {
              $set: {
                status: 'AVAILABLE',
                ticketId: null,
                reservationExpires: null
              }
            },
            { session }
          );

          // Actualizar el ticket a FAILED
          ticket.status = 'FAILED';
          if (paymentId) {
            ticket.paymentId = paymentId;
          }
          await ticket.save({ session });

          console.log('Asientos liberados y ticket actualizado:', {
            ticketId: ticket._id,
            seats: ticket.seats,
            newStatus: 'FAILED'
          });
        }
      });

    } finally {
      await session.endSession();
    }

    // Construir URL de error con parámetros
    const errorUrl = new URL('/payment/error', req.url);
    errorUrl.searchParams.set('ticketId', externalReference);
    if (status) {
      errorUrl.searchParams.set('status', status);
    }
    if (paymentId) {
      errorUrl.searchParams.set('paymentId', paymentId);
    }

    console.log('Redirigiendo a:', errorUrl.toString());

    return NextResponse.redirect(errorUrl);

  } catch (error) {
    console.error('Error en failure callback:', error);
    return NextResponse.redirect(
      new URL('/payment/error', req.url)
    );
  }
}