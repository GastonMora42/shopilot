// app/api/tickets/validate/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';

// app/api/tickets/validate/route.ts
export async function POST(req: Request) {
  try {
    await dbConnect();
    const { qrCode } = await req.json();

    const session = await (await dbConnect()).startSession();
    try {
      await session.withTransaction(async () => {
        const ticket = await Ticket.findOne({ qrCode }).populate('eventId').session(session);

        if (!ticket) {
          throw new Error('Ticket no encontrado');
        }

        if (ticket.status === 'USED') {
          throw new Error('Ticket ya utilizado');
        }

        // Actualizar ticket
        ticket.status = 'USED';
        await ticket.save({ session });

        // Asegurarnos que el asiento esté marcado como OCCUPIED
        await Seat.updateMany(
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
      });

      return NextResponse.json({ success: true });
    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Error validating ticket:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error validando ticket' },
      { status: 500 }
    );
  }
}