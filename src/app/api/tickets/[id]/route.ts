// app/api/tickets/[id]/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { isValidObjectId } from 'mongoose';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!isValidObjectId(params.id)) {
      return NextResponse.json(
        { error: 'ID de ticket inválido' },
        { status: 400 }
      );
    }

    await dbConnect();

    const ticket = await Ticket.findById(params.id).populate('eventId');

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket._id,
        status: ticket.status,
        eventName: ticket.eventId.name,
        date: ticket.eventId.date,
        location: ticket.eventId.location,
        seats: ticket.seats,
        qrCode: ticket.qrCode,
        buyerInfo: ticket.buyerInfo,
        price: ticket.price
      }
    });

  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: 'Error al obtener el ticket' },
      { status: 500 }
    );
  }
}