// app/api/webhooks/mercadopago/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { sendTicketEmail } from '@/app/lib/email';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

const payment = new Payment(client);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Webhook recibido:', body);

    // 1. Validaciones iniciales
    if (body.type !== 'payment' || !body.data?.id) {
      console.log('Webhook ignorado - tipo incorrecto o sin ID');
      return NextResponse.json({ message: 'Notificación ignorada' });
    }

    // 2. Obtener información del pago
    const paymentInfo = await payment.get({ id: body.data.id });
    console.log('Información de pago:', {
      id: paymentInfo.id,
      status: paymentInfo.status,
      external_reference: paymentInfo.external_reference
    });

    if (!paymentInfo.external_reference) {
      return NextResponse.json({ error: 'Falta referencia de ticket' }, { status: 400 });
    }

    // 3. Procesar el pago
    await dbConnect();
    const session = await (await dbConnect()).startSession();

    try {
      await session.withTransaction(async () => {
        // Encontrar y actualizar el ticket
        const ticket = await Ticket.findById(paymentInfo.external_reference)
          .populate('eventId')
          .session(session);

        if (!ticket) {
          throw new Error(`Ticket no encontrado: ${paymentInfo.external_reference}`);
        }

        // Actualizar solo si el estado es correcto
        if (ticket.status === 'PENDING' && paymentInfo.status === 'approved') {
          // Actualizar ticket
          ticket.status = 'PAID';
          ticket.paymentId = String(paymentInfo.id);
          await ticket.save({ session });

          // Actualizar asientos
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

          // Enviar email de confirmación
          try {
            await sendTicketEmail({
              ticket: {
                eventName: ticket.eventId.name,
                date: ticket.eventId.date,
                location: ticket.eventId.location,
                seats: ticket.seats
              },
              qrCode: ticket.qrCode,
              email: ticket.buyerInfo.email
            });
            console.log('Email enviado a:', ticket.buyerInfo.email);
          } catch (emailError) {
            console.error('Error enviando email:', emailError);
          }

          console.log('Ticket actualizado exitosamente:', {
            id: ticket._id,
            status: 'PAID',
            paymentId: paymentInfo.id
          });
        } else {
          console.log('No se requiere actualización:', {
            ticketStatus: ticket.status,
            paymentStatus: paymentInfo.status
          });
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Webhook procesado correctamente'
      });

    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Error procesando webhook:', error);
    return NextResponse.json(
      { error: 'Error procesando webhook', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}