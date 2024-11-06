// app/api/tickets/summary/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Event } from '@/app/models/Event';

export async function GET(_req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Obtener todos los eventos del usuario
    const events = await Event.find({ 
      organizerId: session.user.id 
    });

    // Obtener resumen de tickets por evento
    const summaries = await Promise.all(
      events.map(async (event) => {
        const tickets = await Ticket.find({ eventId: event._id });

        const totalTickets = tickets.length;
        const usedTickets = tickets.filter(t => t.status === 'USED').length;
        const pendingTickets = tickets.filter(t => t.status === 'PENDING').length;
        const totalRevenue = tickets
          .filter(t => t.status === 'PAID' || t.status === 'USED')
          .reduce((sum, ticket) => sum + ticket.price, 0);

        return {
          eventId: event._id,
          eventName: event.name,
          totalTickets,
          usedTickets,
          pendingTickets,
          totalRevenue
        };
      })
    );

    return NextResponse.json({ 
      success: true, 
      summaries 
    });

  } catch (error) {
    console.error('Error getting ticket summary:', error);
    return NextResponse.json(
      { error: 'Error al obtener resumen de tickets' },
      { status: 500 }
    );
  }
}