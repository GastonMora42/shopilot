import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import { Event } from '@/app/models/Event';
import { Payment } from 'mercadopago';
import { mpClient } from '@/app/lib/mercadopago';

export async function POST(req: Request) {
  console.log('Webhook iniciado');
  try {
    const data = await req.json();
    console.log('Datos recibidos del webhook:', data);

    // Verificar que sea una notificación de pago
    if (data.type !== 'payment') {
      console.log('Notificación ignorada');
      return NextResponse.json({ message: 'Notificación ignorada' });
    }

    await dbConnect();
    console.log('Conexión a la base de datos exitosa');

    // Obtener detalles del pago usando el cliente de MercadoPago
    const payment = await new Payment(mpClient).get({ id: data.data.id });
    console.log('Detalles del pago:', payment);
    const ticketId = payment.external_reference;
    const paymentStatus = payment.status;

    // Iniciar una sesión de transacción
    const session = await (await dbConnect()).startSession();
    try {
      await session.withTransaction(async () => {
        console.log('Transacción iniciada');

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
          console.log('Ticket actualizado:', ticket);

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
          console.log('Resultado de la actualización de asientos:', seatUpdateResult);

          // Actualizar el número de asientos disponibles en el evento
          await Event.findByIdAndUpdate(
            ticket.eventId,
            { $inc: { availableSeats: -ticket.seats.length } },
            { session }
          );
          console.log('Evento actualizado');
        }
      });

      console.log('Transacción completada');
      return NextResponse.json({ success: true });
    } finally {
      await session.endSession();
      console.log('Sesión finalizada');
    }
  } catch (error) {
    console.error('Error procesando webhook:', error);
    return NextResponse.json(
      { error: 'Error procesando webhook' },
      { status: 500 }
    );
  }
}
