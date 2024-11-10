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

interface PaymentResponse {
  id: string;
  status: string;
  external_reference: string;
  transaction_amount: number;
  date_approved: string;
  date_created: string;
}

export async function POST(req: Request) {
  try {
    const body: { data: { id: string } } = await req.json();
    console.log('1. Webhook recibido:', body);

    if (!body.data?.id) {
      console.log('Webhook ignorado - sin ID de pago');
      return new Response(null, { status: 200 });
    }

    // Obtener información del pago
    const paymentInfo = await payment.get({ id: body.data.id }) as unknown as PaymentResponse;
    console.log('2. Información del pago:', {
      id: paymentInfo.id,
      status: paymentInfo.status,
      external_reference: paymentInfo.external_reference,
      amount: paymentInfo.transaction_amount
    });

    // Si no hay external_reference, no podemos procesar
    if (!paymentInfo.external_reference) {
      console.error('Falta external_reference en el pago');
      return new Response(null, { status: 200 });
    }

    await dbConnect();

    // Si el pago está aprobado, actualizamos el ticket
    if (paymentInfo.status === "approved") {
      const ticket = await Ticket.findById(paymentInfo.external_reference);
      
      if (!ticket) {
        console.error('Ticket no encontrado:', paymentInfo.external_reference);
        return new Response(null, { status: 200 });
      }

      console.log('3. Ticket encontrado:', {
        id: ticket._id,
        currentStatus: ticket.status
      });

      // Solo actualizar si el ticket está en PENDING
      if (ticket.status === 'PENDING') {
        // Actualizar el ticket
        ticket.status = 'PAID';
        ticket.paymentId = paymentInfo.id;
        await ticket.save();

        console.log('4. Ticket actualizado a PAID');

        // Actualizar los asientos
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
          }
        );

        console.log('5. Asientos actualizados:', {
          matched: seatResult.matchedCount,
          modified: seatResult.modifiedCount
        });

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
          console.log('6. Email enviado a:', ticket.buyerInfo.email);
        } catch (emailError) {
          console.error('Error enviando email:', emailError);
        }
      }
    }
    // Si el pago es rechazado o cancelado
    else if (['rejected', 'cancelled'].includes(paymentInfo.status)) {
      const ticket = await Ticket.findById(paymentInfo.external_reference);
      
      if (ticket && ticket.status === 'PENDING') {
        // Liberar asientos
        await Seat.updateMany(
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
          }
        );

        ticket.status = 'FAILED';
        await ticket.save();

        console.log('Asientos liberados por pago fallido:', {
          ticketId: ticket._id,
          seats: ticket.seats
        });
      }
    }

    // Siempre responder con 200 a MercadoPago
    return new Response(null, { status: 200 });

  } catch (error) {
    console.error('Error procesando webhook:', error);
    // Siempre responder con 200 a MercadoPago incluso si hay error
    return new Response(null, { status: 200 });
  }
}