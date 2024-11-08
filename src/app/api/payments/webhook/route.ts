// app/api/webhooks/mercadopago/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import { Event } from '@/app/models/Event';
import { Payment } from 'mercadopago';
import { mpClient } from '@/app/lib/mercadopago';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log('Webhook received:', data);

    // Verificar que sea una notificación de pago
    if (data.type !== 'payment') {
      return NextResponse.json({ message: 'Notificación ignorada' });
    }

    await dbConnect();

    // Obtener detalles del pago usando el cliente de MercadoPago
    const payment = await new Payment(mpClient).get({ id: data.data.id });
    const ticketId = payment.external_reference;
    const paymentStatus = payment.status;

    // Iniciar una sesión de transacción
    const session = await (await dbConnect()).startSession();
    try {
      await session.withTransaction(async () => {
        // Encontrar el ticket correspondiente
        const ticket = await Ticket.findById(ticketId).session(session);
        if (!ticket) {
          throw new Error('Ticket no encontrado');
        }

        if (paymentStatus === 'approved') {
          // Actualizar estado del ticket
          ticket.status = 'PAID';
          ticket.paymentId = payment.id;
          await ticket.save({ session });

          // Actualizar el estado de los asientos asociados al ticket
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

          // Aquí podrías agregar una lógica para enviar un email de confirmación con el QR
        }
      });

      return NextResponse.json({ success: true });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Error procesando webhook' },
      { status: 500 }
    );
  }
}
