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

    await dbConnect();
    const ticketId = data.data.external_reference;
    const paymentStatus = data.data.status;

    const session = await (await dbConnect()).startSession();
    try {
      await session.withTransaction(async () => {
        const ticket = await Ticket.findById(ticketId).session(session);

        if (!ticket) {
          throw new Error('Ticket no encontrado');
        }

        if (paymentStatus === 'approved') {
          // Actualizar ticket
          ticket.status = 'PAID';
          ticket.paymentId = data.data.id;
          await ticket.save({ session });

          // Actualizar estado del asiento
          const seatUpdateResult = await Seat.updateMany(
            {
              eventId: ticket.eventId,
              number: { $in: ticket.seats }
            },
            {
              status: 'OCCUPIED',
              ticketId: ticket._id
            },
            { session }
          );

          console.log('Seats update result:', seatUpdateResult);
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