// app/api/webhooks/mercadopago/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { PaymentResponse } from 'mercadopago/dist/clients/payment/commonTypes';
import { sendTicketEmail } from '@/app/lib/email';

if (!process.env.MP_ACCESS_TOKEN) {
  throw new Error('MP_ACCESS_TOKEN no está definido');
}

if (!process.env.MP_WEBHOOK_SECRET) {
  throw new Error('MP_WEBHOOK_SECRET no está definido');
}

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const payment = new Payment(client);

export async function POST(req: Request) {
  try {
    // Obtener el cuerpo como texto
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    
    // Verificar la firma del webhook solo en producción
    const signature = req.headers.get('x-signature');
    const isProduction = process.env.NODE_ENV === 'production';
    
    console.log('1. Webhook recibido:', {
      headers: Object.fromEntries(req.headers),
      body,
      signature,
      environment: process.env.NODE_ENV
    });

    // En producción, verificar la firma
    if (isProduction && signature !== process.env.MP_WEBHOOK_SECRET) {
      console.error('Firma del webhook inválida o faltante en producción');
      return new Response('Unauthorized', { status: 401 });
    }

    // Verificar que sea una notificación de pago
    if (body.type !== 'payment') {
      console.log('Notificación ignorada - tipo incorrecto');
      return new Response(null, { status: 200 });
    }

    if (!body.data?.id) {
      console.error('Falta ID de pago en la notificación');
      return new Response(null, { status: 200 });
    }

    // Obtener detalles del pago
    const paymentInfo = await payment.get({ id: body.data.id }) as PaymentResponse;

    // Validar que tengamos toda la información necesaria
    if (!paymentInfo.status || !paymentInfo.id || !paymentInfo.external_reference) {
      console.error('Información de pago incompleta:', paymentInfo);
      return new Response(null, { status: 200 });
    }

    // Convertir los valores a tipos seguros
    const paymentStatus = paymentInfo.status as string;
    const paymentId = String(paymentInfo.id);
    const externalReference = paymentInfo.external_reference;
    
    console.log('2. Información del pago:', {
      id: paymentId,
      status: paymentStatus,
      external_reference: externalReference,
      date_approved: paymentInfo.date_approved,
      date_created: paymentInfo.date_created
    });

    await dbConnect();

    // Buscar el ticket
    const ticket = await Ticket.findById(externalReference);
    
    if (!ticket) {
      console.error('Ticket no encontrado:', externalReference);
      return new Response(null, { status: 200 });
    }

    console.log('3. Ticket encontrado:', {
      id: ticket._id,
      currentStatus: ticket.status,
      currentPaymentId: ticket.paymentId
    });

    const session = await (await dbConnect()).startSession();

    try {
      await session.withTransaction(async () => {
        // Procesar pago aprobado
        if (paymentStatus === "approved" && ticket.status === 'PENDING') {
          await ticket.markAsPaid(paymentId);

          console.log('4. Ticket actualizado a PAID:', {
            id: ticket._id,
            newPaymentId: paymentId
          });

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

          console.log('5. Asientos actualizados:', {
            matched: seatResult.matchedCount,
            modified: seatResult.modifiedCount,
            seats: ticket.seats
          });

          // Enviar email
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
            console.log('6. Email enviado a:', ticket.buyerInfo.email);
          } catch (emailError) {
            console.error('Error enviando email:', emailError);
          }
        } 
        // Procesar pago fallido
        else if (['rejected', 'cancelled'].includes(paymentStatus) && ticket.status === 'PENDING') {
          await ticket.markAsFailed(paymentId);

          // Liberar asientos
          const seatResult = await Seat.updateMany(
            {
              eventId: ticket.eventId,
              number: { $in: ticket.seats }
            },
            {
              $set: {
                status: 'AVAILABLE',
                ticketId: null,
                reservationExpires: null
              }
            },
            { session }
          );

          console.log('7. Pago fallido, asientos liberados:', {
            ticketId: ticket._id,
            paymentId: paymentId,
            seats: ticket.seats,
            seatsUpdated: seatResult.modifiedCount
          });
        } else {
          console.log('No se requiere actualización:', {
            ticketStatus: ticket.status,
            paymentStatus: paymentStatus
          });
        }
      });

    } finally {
      await session.endSession();
    }

    return new Response(null, { status: 200 });

  } catch (error) {
    console.error('Error procesando webhook:', error);
    return new Response(null, { status: 200 });
  }
}