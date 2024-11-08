// app/api/webhooks/mercadopago/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';

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

    console.log('Processing payment:', { ticketId, paymentStatus }); // Debug log

    const session = await (await dbConnect()).startSession();
    
    try {
      await session.withTransaction(async () => {
        // Buscar ticket y verificar estado actual
        const ticket = await Ticket.findById(ticketId).session(session);
        
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

          // Actualizar asientos a OCCUPIED
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

          console.log('Seats update result:', seatUpdateResult); // Debug log

          // Verificar que los asientos se actualizaron
          const updatedSeats = await Seat.find({
            eventId: ticket.eventId,
            number: { $in: ticket.seats }
          }).session(session);

          console.log('Updated seats:', updatedSeats); // Debug log
        }
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
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