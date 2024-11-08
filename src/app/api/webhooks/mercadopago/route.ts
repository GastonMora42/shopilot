// app/api/webhooks/mercadopago/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log('Webhook received:', data);

    // Verificar que sea una notificación de pago
    if (data.type !== 'payment') {
      return NextResponse.json({ message: 'Notificación ignorada' });
    }

    const paymentId = data.data.id;
    const status = data.data.status;
    const externalReference = data.data.external_reference;

    console.log('Processing payment:', { paymentId, status, externalReference });

    await dbConnect();
    const session = await (await dbConnect()).startSession();

    try {
      await session.withTransaction(async () => {
        const ticket = await Ticket.findById(externalReference).session(session);

        if (!ticket) {
          throw new Error(`Ticket no encontrado: ${externalReference}`);
        }

        console.log('Current ticket status:', ticket.status);

        // Solo procesar si el ticket está pendiente
        if (ticket.status === 'PENDING') {
          if (status === 'approved') {
            // Actualizar ticket
            ticket.status = 'PAID';
            ticket.paymentId = paymentId;
            await ticket.save({ session });

            // Actualizar asientos
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

            console.log('Seats update result:', seatUpdateResult);
          } else if (['rejected', 'cancelled'].includes(status)) {
            // Si el pago falló, liberar asientos
            ticket.status = 'CANCELLED';
            await ticket.save({ session });

            await Seat.updateMany(
              {
                eventId: ticket.eventId,
                number: { $in: ticket.seats }
              },
              {
                $set: { status: 'AVAILABLE' },
                $unset: { ticketId: "" }
              },
              { session }
            );
          }
        }
      });

      return NextResponse.json({ success: true });
    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Error procesando webhook' },
      { status: 500 }
    );
  }
}