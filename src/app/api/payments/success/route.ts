// app/api/payments/success/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('payment_id');
    const status = searchParams.get('collection_status');
    const ticketId = searchParams.get('external_reference');

    console.log('Success callback received:', { paymentId, status, ticketId });

    if (status === 'approved' && ticketId) {
      await dbConnect();
      
      // Actualizar ticket si aún no está PAID
      const ticket = await Ticket.findById(ticketId);
      if (ticket && ticket.status === 'PENDING') {
        const session = await (await dbConnect()).startSession();
        try {
          await session.withTransaction(async () => {
            ticket.status = 'PAID';
            ticket.paymentId = paymentId;
            await ticket.save({ session });

            // Actualizar asientos si aún no están ocupados
            await Seat.updateMany(
              {
                eventId: ticket.eventId,
                number: { $in: ticket.seats },
                status: { $ne: 'OCCUPIED' }
              },
              {
                $set: {
                  status: 'OCCUPIED',
                  ticketId: ticket._id
                }
              },
              { session }
            );
          });
        } finally {
          await session.endSession();
        }
      }
    }

    // Siempre redirigir a la página de éxito para que maneje la visualización
    const successPageUrl = new URL('/payment/success', req.url);
    successPageUrl.searchParams.set('ticketId', ticketId || '');
    successPageUrl.searchParams.set('payment_id', paymentId || '');
    successPageUrl.searchParams.set('collection_status', status || '');

    return NextResponse.redirect(successPageUrl);

  } catch (error) {
    console.error('Error processing success callback:', error);
    return NextResponse.redirect(new URL('/payment/error', req.url));
  }
}