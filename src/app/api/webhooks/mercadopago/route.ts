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
    // Obtener y parsear el body
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    
    console.log('1. Webhook recibido:', {
      body,
      timestamp: new Date().toISOString()
    });

    // Verificar que sea notificación de pago y tenga ID
    if (body.type !== 'payment' || !body.data?.id) {
      console.log('Notificación ignorada:', body.type);
      return new Response(null, { status: 200 });
    }

    // Obtener detalles del pago
    const paymentInfo = await payment.get({ id: body.data.id }) as PaymentResponse;
    
    console.log('2. Información del pago:', {
      id: paymentInfo.id,
      status: paymentInfo.status,
      external_reference: paymentInfo.external_reference,
      payment_data: paymentInfo
    });

    if (!paymentInfo.status || !paymentInfo.id || !paymentInfo.external_reference) {
      console.error('Información de pago incompleta');
      return new Response(null, { status: 200 });
    }

    const paymentStatus = paymentInfo.status as string;
    const paymentId = String(paymentInfo.id);

    await dbConnect();

    // Buscar y actualizar el ticket en una sola operación
    const ticket = await Ticket.findOneAndUpdate(
      { 
        _id: paymentInfo.external_reference,
        status: 'PENDING'  // Solo actualizar si está pendiente
      },
      {
        $set: {
          status: paymentStatus === 'approved' ? 'PAID' : 'FAILED',
          paymentId: paymentId
        }
      },
      { new: true }
    ).populate('eventId');

    if (!ticket) {
      console.log('Ticket no encontrado o ya procesado');
      return new Response(null, { status: 200 });
    }

    console.log('3. Ticket actualizado:', {
      id: ticket._id,
      newStatus: ticket.status,
      paymentId: ticket.paymentId
    });

    // Si el pago fue aprobado, actualizar asientos
    if (paymentStatus === 'approved') {
      const seatResult = await Seat.updateMany(
        {
          eventId: ticket.eventId._id,
          number: { $in: ticket.seats }
        },
        {
          $set: {
            status: 'OCCUPIED',
            ticketId: ticket._id
          }
        }
      );

      console.log('4. Asientos actualizados:', {
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
        console.log('5. Email enviado a:', ticket.buyerInfo.email);
      } catch (emailError) {
        console.error('Error enviando email:', emailError);
      }
    } else {
      // Si el pago falló, liberar asientos
      await Seat.updateMany(
        {
          eventId: ticket.eventId._id,
          number: { $in: ticket.seats }
        },
        {
          $set: {
            status: 'AVAILABLE',
            ticketId: null,
            reservationExpires: null
          }
        }
      );

      console.log('4. Asientos liberados por pago fallido:', {
        seats: ticket.seats
      });
    }

    return new Response(null, { status: 200 });

  } catch (error) {
    console.error('Error procesando webhook:', error);
    return new Response(null, { status: 200 });
  }
}