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

type PaymentInfo = {
  id: number | string;
  status: string;
  external_reference: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    console.log('Webhook received:', {
      type: body.type,
      data: body.data,
      timestamp: new Date().toISOString()
    });

    // Solo procesar notificaciones de pago
    if (body.type !== 'payment') {
      return NextResponse.json({ message: 'Notificación ignorada' });
    }

    if (!body.data?.id) {
      console.error('Missing payment ID');
      return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 });
    }

    await dbConnect();

    // Obtener detalles del pago
    const paymentInfo = await payment.get({ id: body.data.id }) as unknown as PaymentInfo;
    
    console.log('Payment info:', {
      id: paymentInfo.id,
      status: paymentInfo.status,
      external_reference: paymentInfo.external_reference
    });

    const ticketId = paymentInfo.external_reference;
    const paymentId = String(paymentInfo.id); // Convertir a string de manera segura
    
    if (!ticketId) {
      console.error('Missing ticket reference');
      return NextResponse.json({ error: 'Missing ticket reference' }, { status: 400 });
    }

    const session = await (await dbConnect()).startSession();

    try {
      const result = await session.withTransaction(async () => {
        // Buscar y actualizar el ticket
        const ticket = await Ticket.findById(ticketId).session(session);
        
        if (!ticket) {
          throw new Error(`Ticket not found: ${ticketId}`);
        }

        console.log('Processing ticket:', {
          id: ticket._id,
          currentStatus: ticket.status,
          paymentStatus: paymentInfo.status
        });

        if (ticket.status === 'PENDING' && paymentInfo.status === 'approved') {
          // Actualizar ticket
          ticket.status = 'PAID';
          ticket.paymentId = paymentId;
          await ticket.save({ session });

          // Actualizar asientos
          const seatResult = await Seat.updateMany(
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

          console.log('Updated seats:', {
            matched: seatResult.matchedCount,
            modified: seatResult.modifiedCount,
            seats: ticket.seats
          });

          return { ticket, seatResult };
        } else {
          console.log('No update needed:', {
            ticketStatus: ticket.status,
            paymentStatus: paymentInfo.status
          });
        }
      });

      console.log('Transaction result:', result);

      return NextResponse.json({
        success: true,
        message: 'Webhook processed successfully',
        data: {
          ticketId,
          paymentId,
          status: paymentInfo.status
        }
      });

    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { 
        error: 'Error processing webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}