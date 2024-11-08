// app/api/webhooks/mercadopago/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import { sendTicketEmail } from '@/app/lib/email';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    if (data.type !== 'payment') {
      return NextResponse.json({ message: 'Notificación ignorada' });
    }

    await dbConnect();
    const ticketId = data.data.external_reference;
    const paymentStatus = data.data.status;

    // Usar transacción para actualizar ticket y asientos
    const session = await (await dbConnect()).startSession();
    try {
      await session.withTransaction(async () => {
        const ticket = await Ticket.findById(ticketId)
          .populate('eventId')
          .session(session);

        if (!ticket) {
          throw new Error('Ticket no encontrado: ' + ticketId);
        }

        if (paymentStatus === 'approved') {
          // Actualizar ticket
          ticket.status = 'PAID';
          ticket.paymentId = data.data.id;
          await ticket.save({ session });

          // Actualizar asientos
          await Seat.updateMany(
            {
              eventId: ticket.eventId._id,
              seatId: { $in: ticket.seats }
            },
            {
              status: 'OCCUPIED',
              ticketId: ticket._id
            },
            { session }
          );

          // Enviar email
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
        } else if (['rejected', 'cancelled'].includes(paymentStatus)) {
          // Liberar asientos si el pago fue rechazado
          await Seat.updateMany(
            {
              eventId: ticket.eventId._id,
              seatId: { $in: ticket.seats }
            },
            {
              status: 'AVAILABLE',
              $unset: { ticketId: "" }
            },
            { session }
          );
          
          ticket.status = 'CANCELLED';
          await ticket.save({ session });
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