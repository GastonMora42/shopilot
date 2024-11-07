// app/api/tickets/[id]/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';

// app/api/tickets/[id]/route.ts
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const ticket = await Ticket.findById(params.id).populate('eventId');
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      eventName: ticket.eventId.name,
      date: ticket.eventId.date,
      location: ticket.eventId.location,
      seats: ticket.seats,
      qrCode: ticket.qrCode,
      buyerInfo: ticket.buyerInfo
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener el ticket' },
      { status: 500 }
    );
  }
}