// src/app/api/tickets/pending/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Event } from '@/app/models/Event';
import { authOptions } from '@/app/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Primero obtenemos los eventos del organizador
    const userEvents = await Event.find({ organizerId: session.user.id });
    const eventIds = userEvents.map(event => event._id);
    
    // Luego buscamos tickets pendientes para esos eventos
    const pendingTickets = await Ticket.find({
      eventId: { $in: eventIds },
      status: 'PENDING',
      transferProof: { $exists: true }
    }).populate('eventId', 'name');
    
    const formattedTickets = pendingTickets.map(ticket => ({
      id: ticket._id,
      eventName: ticket.eventId.name,
      buyerName: ticket.buyerInfo.name,
      buyerEmail: ticket.buyerInfo.email,
      price: ticket.price,
      seats: ticket.seats,
      ticketType: ticket.ticketType && {
        name: ticket.ticketType.name,
        quantity: ticket.quantity
      },
      createdAt: ticket.createdAt,
      transferProof: {
        imageUrl: ticket.transferProof.imageUrl,
        notes: ticket.transferProof.notes,
        uploadedAt: ticket.transferProof.uploadedAt
      }
    }));
    
    return NextResponse.json({
      success: true,
      tickets: formattedTickets
    });
    
  } catch (error) {
    console.error('Error al obtener tickets pendientes:', error);
    return NextResponse.json(
      { error: 'Error al obtener tickets pendientes' },
      { status: 500 }
    );
  }
}