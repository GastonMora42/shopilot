// app/api/tickets/validate/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import { Event } from '@/app/models/Event';

export async function POST(req: Request) {
  let session = null;
  
  try {
    await dbConnect();
    const { qrCode } = await req.json();
    
    session = await (await dbConnect()).startSession();
    await session.startTransaction();

    const ticket = await Ticket.findOne({ qrCode })
      .populate('eventId')
      .session(session);

    if (!ticket) {
      throw new Error('Ticket no encontrado');
    }

    if (ticket.status === 'USED') {
      throw new Error('Ticket ya utilizado');
    }

    if (ticket.status !== 'PAID') {
      throw new Error('Ticket no válido para su uso');
    }

    // Actualizar ticket
    ticket.status = 'USED';
    await ticket.save({ session });

    // Manejar según el tipo de ticket
    if (ticket.eventType === 'SEATED') {
      await Seat.updateMany(
        {
          eventId: ticket.eventId,
          seatId: { $in: ticket.seats },
          status: 'OCCUPIED'
        },
        {
          ticketId: ticket._id
        },
        { session }
      );
    }

    await session.commitTransaction();

    return NextResponse.json({ 
      success: true,
      message: 'Ticket validado correctamente',
      ticket: {
        eventName: ticket.eventId.name,
        buyerName: ticket.buyerInfo.name,
        eventType: ticket.eventType,
        ...(ticket.eventType === 'SEATED' 
          ? { seat: ticket.seats.join(', ') }
          : { ticketType: ticket.ticketType }),
        status: ticket.status
      }
    });

  } catch (error) {
    if (session) await session.abortTransaction();
    console.error('Error validating ticket:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Error validando ticket'
    }, { status: 400 });
  } finally {
    if (session) await session.endSession();
  }
}