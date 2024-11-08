// app/api/payments/verify/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';

export async function GET(req: Request) {
    try {
      const { searchParams } = new URL(req.url);
      const ticketId = searchParams.get('ticketId');
  
      if (!ticketId) {
        return NextResponse.json({ error: 'Ticket ID requerido' }, { status: 400 });
      }
  
      await dbConnect();
  
      const ticket = await Ticket.findById(ticketId);
      if (!ticket) {
        return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
      }
  
      // Verificar asientos
      const seats = await Seat.find({
        eventId: ticket.eventId,
        number: { $in: ticket.seats }
      });
  
      return NextResponse.json({
        success: true,
        ticketStatus: ticket.status,
        seats: seats.map(seat => ({
          number: seat.number,
          status: seat.status
        }))
      });
  
    } catch (error) {
      console.error('Error verifying payment:', error);
      return NextResponse.json(
        { error: 'Error verificando pago' },
        { status: 500 }
      );
    }
  }