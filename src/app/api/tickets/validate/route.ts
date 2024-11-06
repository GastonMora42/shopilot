// src/app/api/tickets/validate/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { eventId, qrCode } = await req.json();

    if (!eventId || !qrCode) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Buscar el ticket
    const ticket = await Ticket.findOne({
      eventId,
      qrCode,
      status: 'PAID'
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket ya utilizado o no es valido' },
        { status: 400 }
      );
    }

    // Marcar el ticket como usado
    ticket.status = 'USED';
    await ticket.save();

    return NextResponse.json({
      success: true,
      ticket: {
        buyerName: ticket.buyerInfo.name,
        buyerEmail: ticket.buyerInfo.email,
        seatNumber: ticket.seatNumber
      }
    });

  } catch (error) {
    console.error('Error validando ticket:', error);
    return NextResponse.json(
      { error: 'Error al validar el ticket' },
      { status: 500 }
    );
  }
}