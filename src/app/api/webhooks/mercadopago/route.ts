// app/api/webhooks/mercadopago/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN!
});

const payment = new Payment(client);

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log('Webhook received:', data);
    
    if (data.type !== 'payment' || !data.data.id) {
      console.log('Invalid webhook data:', data);
      return NextResponse.json({ message: 'Notificación inválida o ignorada' });
    }

    await dbConnect();

    try {
      // Asegurarnos que tenemos un ID de pago válido
      const paymentId = String(data.data.id);
      const paymentInfo = await payment.get({ id: paymentId });
      console.log('Payment info from MP:', paymentInfo);

      const ticketId = paymentInfo.external_reference;
      const paymentStatus = paymentInfo.status;

      if (!ticketId) {
        throw new Error('Missing ticket reference');
      }

      console.log('Processing payment:', {
        ticketId,
        paymentStatus,
        paymentId
      });

      const session = await (await dbConnect()).startSession();

      try {
        await session.withTransaction(async () => {
          const ticket = await Ticket.findById(ticketId).session(session);

          if (!ticket) {
            throw new Error(`Ticket no encontrado: ${ticketId}`);
          }

          if (ticket.status === 'PAID') {
            console.log(`Ticket ${ticketId} already paid`);
            return;
          }

          if (paymentStatus === 'approved') {
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

            console.log('Seats update result:', {
              ticketId,
              seats: ticket.seats,
              result: seatUpdateResult
            });
          } else if (['rejected', 'cancelled'].includes(status)) {
            // Si el pago fue rechazado, liberar asientos
            ticket.status = 'CANCELLED';
            await ticket.save({ session });

            const seatReleaseResult = await Seat.updateMany(
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

            console.log('Seats released:', {
              ticketId,
              seats: ticket.seats,
              result: seatReleaseResult
            });
          }
        });
      } finally {
        await session.endSession();
      }

      return NextResponse.json({ 
        success: true,
        message: `Payment ${paymentStatus} processed successfully`,
        ticketId,
        paymentId
      });

    } catch (mpError) {
      console.error('Error verifying payment with MercadoPago:', mpError);
      throw mpError;
    }

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { 
        error: 'Error procesando webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}