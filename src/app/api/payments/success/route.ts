// app/api/payments/success/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import { MercadoPagoConfig, Payment } from 'mercadopago';

// Configurar MercadoPago
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN!
});

const payment = new Payment(client);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('payment_id');
    const collectionStatus = searchParams.get('collection_status');
    const externalReference = searchParams.get('external_reference');

    console.log('Payment callback received:', {
      paymentId,
      collectionStatus,
      externalReference
    });

    if (!paymentId || !externalReference) {
      console.error('Missing required parameters');
      return NextResponse.redirect(
        new URL('/payment/error', req.url)
      );
    }

    await dbConnect();

    // Verificar el pago con MercadoPago
    try {
      const paymentInfo = await payment.get({ id: paymentId });
      console.log('Payment info from MP:', paymentInfo);

      if (paymentInfo.status === 'approved') {
        const session = await (await dbConnect()).startSession();
        
        try {
          await session.withTransaction(async () => {
            const ticket = await Ticket.findById(externalReference)
              .session(session);

            if (!ticket) {
              throw new Error(`Ticket not found: ${externalReference}`);
            }

            if (ticket.status === 'PENDING') {
              // Actualizar ticket
              ticket.status = 'PAID';
              ticket.paymentId = paymentId;
              await ticket.save({ session });

              // Actualizar asientos
              const seatUpdateResult = await Seat.updateMany(
                {
                  eventId: ticket.eventId,
                  number: { $in: ticket.seats }
                },
                {
                  $set: {
                    status: 'OCCUPIED',
                    ticketId: ticket._id
                  }
                },
                { session }
              );

              console.log('Seats update result:', seatUpdateResult);
            } else {
              console.log(`Ticket ${externalReference} already processed. Status: ${ticket.status}`);
            }
          });
        } finally {
          await session.endSession();
        }
      } else {
        console.log(`Payment ${paymentId} not approved. Status: ${paymentInfo.status}`);
      }
    } catch (mpError) {
      console.error('Error verifying payment with MercadoPago:', mpError);
    }

    // Siempre redirigir a la página de éxito con el ticketId
    // La página de éxito se encargará de verificar el estado final
    const successUrl = new URL(`/payment/success`, req.url);
    successUrl.searchParams.set('ticketId', externalReference);
    successUrl.searchParams.set('payment_id', paymentId);
    successUrl.searchParams.set('collection_status', collectionStatus || '');

    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error('Error processing success callback:', error);
    return NextResponse.redirect(
      new URL('/payment/error', req.url)
    );
  }
}