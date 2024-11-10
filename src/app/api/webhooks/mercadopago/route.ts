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

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const payment = new Payment(client);

export async function POST(req: Request) {
  try {
    // Obtener el cuerpo como texto
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    
    console.log('1. Webhook recibido:', {
      body,
      headers: Object.fromEntries(req.headers),
      timestamp: new Date().toISOString()
    });

    // Verificar que tengamos un ID de pago
    if (!body.data?.id) {
      console.error('Falta ID de pago en la notificación');
      return new Response(null, { status: 200 });
    }
    // Obtener detalles del pago
    const paymentInfo = await payment.get({ id: body.data.id }) as PaymentResponse;
    
    console.log('2. Información del pago:', {
      id: paymentInfo.id,
      status: paymentInfo.status,
      external_reference: paymentInfo.external_reference,
      raw: paymentInfo
    });

    if (!paymentInfo.status || !paymentInfo.id || !paymentInfo.external_reference) {
      console.error('Información de pago incompleta');
      return new Response(null, { status: 200 });
    }

    const paymentStatus = paymentInfo.status as string;
    const paymentId = String(paymentInfo.id);
    const externalReference = paymentInfo.external_reference;

    await dbConnect();

    const ticket = await Ticket.findById(externalReference);
    
    if (!ticket) {
      console.error('Ticket no encontrado:', externalReference);
      return new Response(null, { status: 200 });
    }

    console.log('3. Ticket encontrado:', {
      id: ticket._id,
      status: ticket.status,
      paymentId: ticket.paymentId
    });

    const session = await (await dbConnect()).startSession();

    try {
      await session.withTransaction(async () => {
        if (paymentStatus === "approved" && ticket.status === 'PENDING') {
          // Actualizar ticket
          const updatedTicket = await Ticket.findOneAndUpdate(
            { 
              _id: ticket._id,
              status: 'PENDING'
            },
            {
              $set: {
                status: 'PAID',
                paymentId: paymentId
              }
            },
            { 
              new: true,
              session,
              runValidators: true
            }
          );

          console.log('4. Ticket actualizado:', {
            id: updatedTicket?._id,
            newStatus: updatedTicket?.status,
            paymentId: updatedTicket?.paymentId
          });

          if (!updatedTicket) {
            throw new Error('No se pudo actualizar el ticket');
          }

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
        } else {
          console.log('No se requiere actualización:', {
            ticketStatus: ticket.status,
            paymentStatus
          });
        }
      });
    } finally {
      await session.endSession();
    }

    // Siempre responder 200 OK a MercadoPago
    return new Response(null, { status: 200 });

  } catch (error) {
    console.error('Error procesando webhook:', error);
    return new Response(null, { status: 200 });
  }
}