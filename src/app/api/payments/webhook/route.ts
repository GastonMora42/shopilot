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
    const body = await req.json();
    console.log('Webhook received:', body);

    if (body.type !== 'payment' || !body.data?.id) {
      return NextResponse.json({ message: 'Notificación ignorada o falta ID de pago' });
    }

    await dbConnect();

    const paymentInfo = await payment.get({ id: body.data.id });
    console.log('Payment info:', paymentInfo);

    if (!paymentInfo?.external_reference) {
      return NextResponse.json({ error: 'Falta referencia de ticket' }, { status: 400 });
    }

    const session = await (await dbConnect()).startSession();

    try {
      await session.withTransaction(async () => {
        const ticket = await Ticket.findById(paymentInfo.external_reference).session(session);
        
        if (!ticket) throw new Error(`Ticket no encontrado: ${paymentInfo.external_reference}`);

        if (ticket.status === 'PENDING' && paymentInfo.status === 'approved') {
          ticket.status = 'PAID';
          ticket.paymentId = String(paymentInfo.id);
          await ticket.save({ session });

          await Seat.updateMany(
            { eventId: ticket.eventId, number: { $in: ticket.seats } },
            { $set: { status: 'OCCUPIED', ticketId: ticket._id } },
            { session }
          );

          console.log('Ticket y asientos actualizados.');
        } else {
          console.log('Estado del ticket o pago no requiere actualización');
        }
      });

      return NextResponse.json({ success: true, message: 'Webhook procesado correctamente' });

    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Error en el webhook:', error);
    return NextResponse.json(
      { error: 'Error al procesar webhook', details: error },
      { status: 500 }
    );
  }
}
