// app/api/payments/verify/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';

export async function POST(req: Request) {
  try {
    const { ticketId, paymentId, status } = await req.json();

    if (!ticketId || !paymentId) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    await dbConnect();
    
    const session = await (await dbConnect()).startSession();
    
    try {
      await session.withTransaction(async () => {
        // Buscar y actualizar el ticket
        const ticket = await Ticket.findById(ticketId).session(session);
        
        if (!ticket) {
          throw new Error('Ticket no encontrado');
        }

        if (ticket.status === 'PENDING') {
          // Actualizar ticket
          ticket.status = status === 'approved' ? 'PAID' : 'CANCELLED';
          ticket.paymentId = paymentId;
          await ticket.save({ session });

          // Si el pago fue aprobado, actualizar asientos a OCCUPIED
          if (status === 'approved') {
            const seatUpdateResult = await Seat.updateMany(
              {
                eventId: ticket.eventId,
                number: { $in: ticket.seats }
              },
              {
                $set: {
                  status: 'OCCUPIED',
                  ticketId: ticket._id
                }
              },
              { session }
            );

            console.log('Seat update result:', seatUpdateResult);
          } else {
            // Si el pago falló, liberar los asientos
            await Seat.updateMany(
              {
                eventId: ticket.eventId,
                number: { $in: ticket.seats }
              },
              {
                $set: {
                  status: 'AVAILABLE'
                },
                $unset: {
                  ticketId: ""
                }
              },
              { session }
            );
          }
        }

        return ticket;
      });

      // Obtener el ticket actualizado para la respuesta
      const updatedTicket = await Ticket.findById(ticketId)
        .populate('eventId', 'name');

      return NextResponse.json({
        success: true,
        ticket: {
          id: updatedTicket._id,
          seats: updatedTicket.seats,
          price: updatedTicket.price,
          status: updatedTicket.status,
          eventName: updatedTicket.eventId.name
        }
      });

    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Error al verificar el pago' },
      { status: 500 }
    );
  }
}