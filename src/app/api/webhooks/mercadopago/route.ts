// app/api/webhooks/mercadopago/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN!
});

const payment = new Payment(client);

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log('Webhook received:', data);

    if (data.type !== 'payment') {
      return NextResponse.json({ message: 'Notificación ignorada' });
    }

    const paymentId = data.data.id;
    console.log('Processing payment:', paymentId);

    // Verificar el pago con MercadoPago
    const paymentInfo = await payment.get({ id: paymentId });
    const externalReference = paymentInfo.external_reference;
    const status = paymentInfo.status;

    console.log('Payment info:', { status, externalReference });

    await dbConnect();
    const session = await (await dbConnect()).startSession();

    try {
      await session.withTransaction(async () => {
        const ticket = await Ticket.findById(externalReference).session(session);

        if (!ticket) {
          throw new Error(`Ticket no encontrado: ${externalReference}`);
        }

        if (ticket.status === 'PENDING') {
          if (status === 'approved') {
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
          }
        } else {
          console.log(`Ticket ${externalReference} already processed. Status: ${ticket.status}`);
        }
      });

      return NextResponse.json({ success: true });
    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Error procesando webhook' },
      { status: 500 }
    );
  }
}