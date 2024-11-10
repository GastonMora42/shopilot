// app/api/webhooks/mercadopago/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { PaymentResponse } from 'mercadopago/dist/clients/payment/commonTypes';
import { sendTicketEmail } from '@/app/lib/email';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

const payment = new Payment(client);

export async function POST(req: Request) {
  try {
    const body: { data: { id: string } } = await req.json();
    console.log('1. Webhook recibido:', body);

    if (!body.data?.id) {
      console.log('Webhook ignorado - falta ID de pago');
      return new Response(null, { status: 200 });
    }

    // Obtener los detalles del pago
    const paymentInfo = await payment.get({ id: body.data.id }) as PaymentResponse;
    
    // Validar información necesaria del pago
    if (!paymentInfo || !paymentInfo.id || !paymentInfo.status || !paymentInfo.external_reference) {
      console.error('Información de pago incompleta:', paymentInfo);
      return new Response(null, { status: 200 });
    }

    console.log('2. Información del pago:', {
      paymentId: String(paymentInfo.id),
      status: paymentInfo.status,
      external_reference: paymentInfo.external_reference
    });

    await dbConnect();

    // Si el pago está aprobado
    if (paymentInfo.status === "approved") {
      // Buscar y actualizar el ticket
      const updatedTicket = await Ticket.findOneAndUpdate(
        { 
          _id: paymentInfo.external_reference,
          status: 'PENDING'
        },
        {
          $set: {
            status: 'PAID',
            paymentId: String(paymentInfo.id)
          }
        },
        { 
          new: true,
          populate: 'eventId'
        }
      );

      console.log('3. Resultado de actualización de ticket:', {
        ticketId: updatedTicket?._id,
        newStatus: updatedTicket?.status,
        paymentId: updatedTicket?.paymentId
      });

      if (updatedTicket) {
        // Actualizar asientos
        const seatResult = await Seat.updateMany(
          {
            eventId: updatedTicket.eventId._id,
            number: { $in: updatedTicket.seats }
          },
          {
            $set: {
              status: 'OCCUPIED',
              ticketId: updatedTicket._id
            }
          }
        );

        console.log('4. Asientos actualizados:', {
          matched: seatResult.matchedCount,
          modified: seatResult.modifiedCount,
          seats: updatedTicket.seats
        });

        // Enviar email de confirmación
        try {
          await sendTicketEmail({
            ticket: {
              eventName: updatedTicket.eventId.name,
              date: updatedTicket.eventId.date,
              location: updatedTicket.eventId.location,
              seats: updatedTicket.seats
            },
            qrCode: updatedTicket.qrCode,
            email: updatedTicket.buyerInfo.email
          });
          console.log('5. Email enviado a:', updatedTicket.buyerInfo.email);
        } catch (emailError) {
          console.error('Error enviando email:', emailError);
        }
      } else {
        console.log('Ticket no encontrado o ya procesado');
      }
    } 
    // Si el pago es rechazado o cancelado
    else if (paymentInfo.status === 'rejected' || paymentInfo.status === 'cancelled') {
      const ticket = await Ticket.findOneAndUpdate(
        { 
          _id: paymentInfo.external_reference,
          status: 'PENDING'
        },
        {
          $set: {
            status: 'FAILED',
            paymentId: String(paymentInfo.id)
          }
        },
        { 
          new: true,
          populate: 'eventId'
        }
      );

      if (ticket) {
        // Liberar asientos
        const seatResult = await Seat.updateMany(
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

        console.log('6. Asientos liberados por pago fallido:', {
          ticketId: ticket._id,
          paymentId: String(paymentInfo.id),
          seats: ticket.seats,
          seatsUpdated: seatResult.modifiedCount
        });
      } else {
        console.log('Ticket no encontrado o ya procesado para pago fallido');
      }
    }

    return new Response(null, { status: 200 });

  } catch (error) {
    console.error('Error procesando webhook:', error);
    return new Response(null, { status: 200 });
  }
}