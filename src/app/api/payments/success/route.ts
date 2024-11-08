// app/api/payments/success/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('payment_id');
    const status = searchParams.get('status');
    const externalReference = searchParams.get('external_reference');

    if (status === 'approved' && externalReference) {
      await dbConnect();
      
      const session = await (await dbConnect()).startSession();
      try {
        await session.withTransaction(async () => {
          const ticket = await Ticket.findById(externalReference)
            .session(session);

          if (ticket && ticket.status === 'PENDING') {
            ticket.status = 'PAID';
            ticket.paymentId = paymentId;
            await ticket.save({ session });

            // Actualizar asientos
            await Seat.updateMany(
              {
                eventId: ticket.eventId,
                seatId: { $in: ticket.seats }
              },
              {
                status: 'OCCUPIED',
                ticketId: ticket._id
              },
              { session }
            );

            console.log('Ticket y asientos actualizados:', externalReference);
          }
        });
      } finally {
        await session.endSession();
      }
    }

    return NextResponse.redirect(
      new URL(`/payment/success?ticketId=${externalReference}`, req.url)
    );

  } catch (error) {
    console.error('Error procesando pago:', error);
    return NextResponse.redirect(
      new URL('/payment/error', req.url)
    );
  }
}