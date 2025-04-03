// src/app/api/tickets/pending/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Event } from '@/app/models/Event';
import { authOptions } from '@/app/lib/auth';
import { TransferTicket } from '@/app/models/TransferTicket';

// src/app/api/tickets/pending/route.ts (modificada)
export async function GET() {
  try {
    console.log("API /tickets/pending: Iniciando solicitud");
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Obtener eventos del organizador
    const userEvents = await Event.find({ organizerId: session.user.id });
    const eventIds = userEvents.map(event => event._id);
    
    // Buscar en la nueva colección específica para transferencias
    const pendingTransferTickets = await TransferTicket.find({
      eventId: { $in: eventIds },
      status: 'PENDING'
    }).populate('eventId', 'name');
    
    console.log(`API /tickets/pending: Tickets encontrados: ${pendingTransferTickets.length}`);
    
    // Formatear los tickets
    const formattedTickets = pendingTransferTickets.map(ticket => ({
      id: ticket.ticketId,
      eventName: ticket.eventId.name,
      buyerName: ticket.buyerInfo.name,
      buyerEmail: ticket.buyerInfo.email,
      price: ticket.price,
      seats: ticket.seats,
      ticketType: ticket.ticketType && ticket.quantity ? {
        name: ticket.ticketType.name,
        quantity: ticket.quantity
      } : undefined,
      createdAt: ticket.createdAt,
      transferProof: {
        imageUrl: ticket.transferProof?.imageUrl || '',
        notes: ticket.transferProof?.notes || '',
        uploadedAt: ticket.transferProof?.uploadedAt || new Date()
      }
    }));
    
    return NextResponse.json({
      success: true,
      tickets: formattedTickets
    });
    
  } catch (error) {
    console.error('Error al obtener tickets pendientes:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener tickets pendientes' },
      { status: 500 }
    );
  }
}