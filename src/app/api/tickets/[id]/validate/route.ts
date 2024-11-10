// app/api/tickets/[id]/validate/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { isValidObjectId } from 'mongoose';
import type { ITicket } from '@/types';

export async function POST(
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
    const session = await (await dbConnect()).startSession();

    try {
      await session.withTransaction(async () => {
        const ticket = await Ticket.findById(params.id)
          .populate('eventId')
          .session(session) as ITicket | null;

        if (!ticket) {
          throw new Error('Ticket no encontrado');
        }

        if (ticket.status !== 'PAID') {
          throw new Error('Ticket no válido o ya utilizado');
        }

        // Actualizar estado del ticket
        ticket.status = 'USED';
        await ticket.save({ session });

        return ticket;
      });

      return NextResponse.json({
        success: true,
        message: 'Ticket validado correctamente'
      });

    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Error validating ticket:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Error al validar el ticket'
      },
      { status: 400 }
    );
  }
}