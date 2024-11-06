// app/api/tickets/validate/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const { qrCode } = await req.json();

    // Buscar el ticket
    const ticket = await Ticket.findOne({ qrCode }).populate('eventId');
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 }
      );
    }

    // Verificar estado del ticket
    if (ticket.status !== 'PAID') {
      return NextResponse.json(
        { error: 'Ticket no pagado' },
        { status: 400 }
      );
    }

    if (ticket.status === 'USED') {
      return NextResponse.json(
        { error: 'Ticket ya utilizado' },
        { status: 400 }
      );
    }

    // Marcar ticket como usado
    ticket.status = 'USED';
    await ticket.save();

    // Devolver información para mostrar
    return NextResponse.json({
      success: true,
      ticket: {
        eventName: ticket.eventId.name,
        buyerName: ticket.buyerInfo.name,
        seatNumber: ticket.seats.join(', '),
        status: 'USED'
      }
    });

  } catch (error) {
    console.error('Error validando ticket:', error);
    return NextResponse.json(
      { error: 'Error al validar ticket' },
      { status: 500 }
    );
  }
}