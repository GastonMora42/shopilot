// app/api/payments/success/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';

// app/api/payments/success/route.ts
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('payment_id');
    const status = searchParams.get('collection_status');
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

            await Seat.updateMany(
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
          }
        });
      } finally {
        await session.endSession();
      }
    }

    // Redirigir a la página de success
    return NextResponse.redirect(
      new URL(`/payment/success?ticketId=${externalReference}`, req.url)
    );

  } catch (error) {
    console.error('Success route error:', error);
    return NextResponse.redirect(
      new URL('/payment/error', req.url)
    );
  }
}