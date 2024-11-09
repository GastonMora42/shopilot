// app/api/webhooks/mercadopago/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import { MercadoPagoConfig, Payment } from 'mercadopago';

// Definir los tipos de estado de pago de MercadoPago
type MercadoPagoPaymentStatus = 
  | 'approved'
  | 'pending'
  | 'authorized'
  | 'in_process'
  | 'in_mediation'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'charged_back';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN!
});

const payment = new Payment(client);

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log('Webhook received:', {
      type: data.type,
      id: data.data?.id,
      timestamp: new Date().toISOString()
    });
    
    // Solo procesar notificaciones de pago
    if (data.type !== 'payment' || !data.data?.id) {
      console.log('Skipping non-payment webhook');
      return NextResponse.json({ message: 'Notificación ignorada' });
    }

    await dbConnect();
    
    // Obtener detalles del pago de MercadoPago
    const paymentId = data.data.id.toString();
    console.log('Fetching payment details:', paymentId);
    
    const paymentInfo = await payment.get({ id: paymentId });
    const paymentStatus = paymentInfo.status as MercadoPagoPaymentStatus;

    console.log('Payment details:', {
      status: paymentStatus,
      external_reference: paymentInfo.external_reference
    });

    const ticketId = paymentInfo.external_reference;
    if (!ticketId) {
      throw new Error('Missing ticket reference');
    }

    const session = await (await dbConnect()).startSession();

    try {
      await session.withTransaction(async () => {
        // Buscar el ticket
        const ticket = await Ticket.findById(ticketId).session(session);
        if (!ticket) {
          throw new Error(`Ticket not found: ${ticketId}`);
        }

        console.log('Found ticket:', {
          id: ticket._id,
          currentStatus: ticket.status,
          paymentStatus
        });

        // Solo procesar si el ticket está pendiente
        if (ticket.status === 'PENDING') {
          if (paymentStatus === 'approved') {
            console.log(`Updating ticket ${ticketId} to PAID`);
            
            // Actualizar ticket
            ticket.status = 'PAID';
            ticket.paymentId = paymentId;
            await ticket.save({ session });

            // Actualizar asientos a OCCUPIED
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

            console.log('Seats updated:', {
              ticketId,
              seats: ticket.seats,
              result: seatUpdateResult
            });
          } else if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
            console.log(`Payment ${paymentStatus} for ticket ${ticketId}`);
            
            // Actualizar ticket a cancelado
            ticket.status = 'CANCELLED';
            await ticket.save({ session });

            // Liberar asientos
            const seatUpdateResult = await Seat.updateMany(
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
              result: seatUpdateResult
            });
          } else {
            console.log(`Payment status ${paymentStatus} not handled for ticket ${ticketId}`);
          }
        } else {
          console.log(`Ticket ${ticketId} already processed, current status: ${ticket.status}`);
        }
      });

      return NextResponse.json({
        success: true,
        ticketId,
        status: paymentStatus
      });

    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { 
        error: 'Error procesando webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}