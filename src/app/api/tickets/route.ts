// app/api/webhooks/mercadopago/route.ts
import { NextResponse } from 'next/server';
import { Payment } from 'mercadopago';
import { mercadopago } from '@/app/lib/mercadopago';
import { Ticket } from '@/app/models/Ticket';
import { Seat, ISeat } from '@/app/models/Seat';
import dbConnect from '@/app/lib/mongodb';
import { MercadoPagoWebhook, MercadoPagoPayment, WebhookResponse } from '@/types';

export async function POST(request: Request) {
  try {
    // Obtener y validar webhook
    const rawBody = await request.text();
    const webhook = JSON.parse(rawBody) as MercadoPagoWebhook;

    console.log('1. Webhook recibido:', {
      type: webhook.type,
      data: webhook.data,
      timestamp: new Date().toISOString()
    });

    if (!webhook.data?.id) {
      console.log('Webhook ignorado - sin ID de pago');
      return new Response(null, { status: 200 });
    }

    // Obtener información del pago
    const paymentInfo = await new Payment(mercadopago).get({ id: webhook.data.id }) as unknown as MercadoPagoPayment;

    console.log('2. Información del pago:', {
      id: paymentInfo.id,
      status: paymentInfo.status,
      external_reference: paymentInfo.external_reference
    });

    // Validar información necesaria
    if (!paymentInfo.id || !paymentInfo.external_reference || !paymentInfo.status) {
      console.error('Información de pago incompleta');
      return new Response(null, { status: 200 });
    }

    await dbConnect();
    const session = await (await dbConnect()).startSession();

    try {
      await session.withTransaction(async () => {
        // Buscar ticket
        const ticket = await Ticket.findById(paymentInfo.external_reference)
          .session(session);

        if (!ticket) {
          console.log('Ticket no encontrado:', {
            ticketId: paymentInfo.external_reference
          });
          return;
        }

        if (paymentInfo.status === 'approved') {
          // Marcar ticket como pagado
          await ticket.markAsPaid(String(paymentInfo.id));

          // Actualizar asientos
          const seatResult = await Seat.updateMany(
            {
              eventId: ticket.eventId,
              number: { $in: ticket.seats },
              status: 'RESERVED'
            },
            {
              $set: {
                status: 'OCCUPIED',
                ticketId: ticket._id
              },
              $unset: {
                reservationExpires: 1
              }
            },
            { session }
          );

          console.log('3. Actualización completada:', {
            ticketId: ticket._id,
            status: 'PAID',
            paymentId: paymentInfo.id,
            seatsUpdated: seatResult.modifiedCount
          });

        } else if (['rejected', 'cancelled'].includes(paymentInfo.status)) {
          // Marcar ticket como fallido
          await ticket.markAsFailed(String(paymentInfo.id));

          // Liberar asientos
          const seatResult = await Seat.updateMany(
            {
              eventId: ticket.eventId,
              number: { $in: ticket.seats }
            },
            {
              $set: { status: 'AVAILABLE' },
              $unset: {
                ticketId: 1,
                reservationExpires: 1
              }
            },
            { session }
          );

          console.log('3. Pago fallido, asientos liberados:', {
            ticketId: ticket._id,
            status: 'FAILED',
            seatsUpdated: seatResult.modifiedCount
          });
        }
      });

      const response: WebhookResponse = {
        success: true,
        message: 'Webhook procesado correctamente'
      };

      return NextResponse.json(response);

    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Error en webhook:', error);
    return NextResponse.json(
      { error: 'Error al procesar el webhook' },
      { status: 500 }
    );
  }
}