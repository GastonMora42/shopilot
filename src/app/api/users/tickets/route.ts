// app/api/users/tickets/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { authOptions } from '@/app/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Obtener tickets con información del evento
    const tickets = await Ticket.find({ 
      userId: session.user.id 
    })
    .populate({
      path: 'eventId',
      select: 'name date location imageUrl'
    })
    .sort({ createdAt: -1 });

    // Formatear la respuesta
    const formattedTickets = tickets.map(ticket => ({
      id: ticket._id,
      eventName: ticket.eventId.name,
      eventDate: ticket.eventId.date,
      eventLocation: ticket.eventId.location,
      eventImage: ticket.eventId.imageUrl,
      seats: ticket.seats,
      ticketType: ticket.ticketType,
      quantity: ticket.quantity,
      status: ticket.status,
      qrCode: ticket.qrCode,
      price: ticket.price,
      buyerInfo: ticket.buyerInfo,
      createdAt: ticket.createdAt
    }));

    return NextResponse.json(formattedTickets);

  } catch (error) {
    console.error('Error fetching user tickets:', error);
    return NextResponse.json(
      { error: 'Error al obtener tickets' },
      { status: 500 }
    );
  }
}