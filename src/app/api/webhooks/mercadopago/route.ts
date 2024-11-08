// app/api/webhooks/mercadopago/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';

// app/api/webhooks/mercadopago/route.ts
export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log('Webhook received:', data);

    if (data.type !== 'payment') {
      return NextResponse.json({ message: 'Notificación ignorada' });
    }

    const paymentId = data.data.id;
    const status = data.data.status;
    const ticketId = data.data.external_reference;

    await dbConnect();
    
    const session = await (await dbConnect()).startSession();
    
    try {
      await session.withTransaction(async () => {
        const ticket = await Ticket.findById(ticketId).session(session);
        
        if (!ticket) {
          throw new Error('Ticket no encontrado');
        }

        if (ticket.status === 'PENDING') {
          ticket.status = status === 'approved' ? 'PAID' : 'CANCELLED';
          ticket.paymentId = paymentId;
          await ticket.save({ session });

          if (status === 'approved') {
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
          } else {
            await Seat.updateMany(
              {
                eventId: ticket.eventId,
                number: { $in: ticket.seats }
              },
              {
                $set: { status: 'AVAILABLE' },
                $unset: { ticketId: "" }
              },
              { session }
            );
          }
        }
      });

      return NextResponse.json({ success: true });
    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Error procesando webhook' },
      { status: 500 }
    );
  }
}