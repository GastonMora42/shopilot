// app/api/webhooks/mercadopago/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import { sendTicketEmail } from '@/app/lib/email';

// app/api/webhooks/mercadopago/route.ts
export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log('Webhook received:', data); // Debug log
    
    if (data.type !== 'payment') {
      return NextResponse.json({ message: 'Notificación ignorada' });
    }

    await dbConnect();
    const ticketId = data.data.external_reference;
    const paymentStatus = data.data.status;

    console.log('Payment status:', paymentStatus, 'for ticket:', ticketId); // Debug log

    // Usar transacción para actualizar ticket y asientos
    const session = await (await dbConnect()).startSession();
    try {
      await session.withTransaction(async () => {
        const ticket = await Ticket.findById(ticketId)
          .populate('eventId')
          .session(session);

        if (!ticket) {
          console.error('Ticket not found:', ticketId);
          throw new Error('Ticket no encontrado');
        }

        console.log('Found ticket:', ticket); // Debug log

        if (paymentStatus === 'approved') {
          // Actualizar ticket
          ticket.status = 'PAID';
          ticket.paymentId = data.data.id;
          await ticket.save({ session });

          // Actualizar asientos
          const updateResult = await Seat.updateMany(
            {
              eventId: ticket.eventId,
              number: { $in: ticket.seats } // Asegúrate de usar el campo correcto
            },
            {
              status: 'OCCUPIED',
              ticketId: ticket._id
            },
            { session }
          );

          console.log('Seats update result:', updateResult); // Debug log
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