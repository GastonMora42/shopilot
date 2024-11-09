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

// app/api/webhooks/mercadopago/route.ts
export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log('Webhook received:', data);

    if (data.type !== 'payment') {
      console.log('Skipping non-payment webhook');
      return NextResponse.json({ message: 'Notificación ignorada' });
    }

    const paymentId = data.data.id;
    console.log('Processing payment:', paymentId);

    await dbConnect();
    
    const paymentInfo = await payment.get({ id: paymentId });
    console.log('Payment info:', paymentInfo);

    const ticketId = paymentInfo.external_reference;
    const status = paymentInfo.status;

    if (!ticketId) {
      console.error('Missing ticket reference');
      return NextResponse.json({ error: 'Missing ticket reference' }, { status: 400 });
    }

    const session = await (await dbConnect()).startSession();

    try {
      await session.withTransaction(async () => {
        const ticket = await Ticket.findById(ticketId).session(session);
        
        if (!ticket) {
          throw new Error(`Ticket not found: ${ticketId}`);
        }

        console.log('Found ticket:', {
          id: ticket._id,
          currentStatus: ticket.status,
          paymentStatus: status
        });

        if (ticket.status === 'PENDING' && status === 'approved') {
          // Actualizar ticket
          ticket.status = 'PAID';
          ticket.paymentId = paymentId;
          await ticket.save({ session });

          // Actualizar asientos
          await Seat.updateMany(
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

          console.log('Ticket and seats updated successfully');
        }
      });

      return NextResponse.json({ success: true });
    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}