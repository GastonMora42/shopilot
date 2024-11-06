// app/api/tickets/[id]/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Event } from '@/app/models/Event';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const ticket = await Ticket.findById(params.id);
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 }
      );
    }

    const event = await Event.findById(ticket.eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...ticket.toObject(),
      eventName: event.name,
      eventDate: event.date,
      eventLocation: event.location
    });

  } catch (error) {
    console.error('Error obteniendo ticket:', error);
    return NextResponse.json(
      { error: 'Error al obtener el ticket' },
      { status: 500 }
    );
  }
}