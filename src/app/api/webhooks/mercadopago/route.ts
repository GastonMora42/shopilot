// app/api/webhooks/mercadopago/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import { Event } from '@/app/models/Event';
import { sendTicketEmail } from '@/app/lib/email';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log('Webhook received:', data);

    // Verificar que sea una notificación de pago
    if (data.type !== 'payment') {
      return NextResponse.json({ message: 'Notificación ignorada' });
    }

    await dbConnect();
    const ticketId = data.data.external_reference;
    const paymentStatus = data.data.status;

    // Iniciar una sesión de transacción para asegurar consistencia
    const session = await (await dbConnect()).startSession();
    try {
      await session.withTransaction(async () => {
        // Buscar ticket y evento asociado
        const ticket = await Ticket.findById(ticketId).populate('eventId').session(session);
        if (!ticket) {
          console.error('Ticket no encontrado:', ticketId);
          throw new Error('Ticket no encontrado');
        }

        if (paymentStatus === 'approved') {
          // Actualizar el estado del ticket
          ticket.status = 'PAID';
          ticket.paymentId = data.data.id;
          await ticket.save({ session });

          // Actualizar el estado de los asientos
          const seatUpdateResult = await Seat.updateMany(
            {
              eventId: ticket.eventId,
              number: { $in: ticket.seats }
            },
            {
              status: 'OCCUPIED',
              ticketId: ticket._id
            },
            { session }
          );
          console.log('Seats update result:', seatUpdateResult);

          // Actualizar el número de asientos disponibles en el evento
          await Event.findByIdAndUpdate(
            ticket.eventId,
            { $inc: { availableSeats: -ticket.seats.length } },
            { session }
          );

          // Enviar email con el ticket y QR
          try {
            await sendTicketEmail({
              ticket: {
                eventName: ticket.eventId.name,
                date: ticket.eventId.date,
                location: ticket.eventId.location,
                seats: ticket.seats,
              },
              qrCode: ticket.qrCode,
              email: ticket.buyerInfo.email,
            });
            console.log('Email enviado:', ticket.buyerInfo.email);
          } catch (emailError) {
            console.error('Error enviando email:', emailError);
          }
          
          console.log('Ticket actualizado a PAID:', ticketId);
        }
      });

      return NextResponse.json({ success: true });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error('Error procesando webhook:', error);
    return NextResponse.json(
      { error: 'Error procesando webhook' },
      { status: 500 }
    );
  }
}
