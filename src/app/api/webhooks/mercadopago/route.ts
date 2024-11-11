// app/api/webhooks/mercadopago/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

const payment = new Payment(client);

type PaymentInfo = {
  id: string | number;
  status: string;
  external_reference: string;
};

export async function POST(req: Request) {
  try {
    // Parsear el cuerpo de la notificación
    const body: { data: { id: string } } = await req.json();
    console.log('Webhook recibido:', body);

    // Solo procesar notificaciones de tipo 'payment'
    if (!body.data?.id) {
      console.log('Webhook ignorado - falta ID de pago');
      return NextResponse.json({ message: 'Webhook ignorado' }, { status: 200 });
    }

    // Obtener los detalles del pago
    const paymentInfo = await payment.get({ id: body.data.id }) as unknown as PaymentInfo;

    // Validar información necesaria del pago
    if (!paymentInfo || !paymentInfo.id || !paymentInfo.status || !paymentInfo.external_reference) {
      console.error('Información de pago incompleta:', paymentInfo);
      return NextResponse.json({ error: 'Información de pago incompleta' }, { status: 200 });
    }

    console.log('Información del pago:', {
      paymentId: String(paymentInfo.id),
      status: paymentInfo.status,
      external_reference: paymentInfo.external_reference
    });

    await dbConnect();

    // Si el pago está aprobado
    if (paymentInfo.status === "approved") {
      // Buscar y actualizar el ticket
      const ticket = await Ticket.findById(paymentInfo.external_reference);
      if (!ticket || ticket.status !== 'PENDING') {
        console.log('Ticket no encontrado o no pendiente:', {
          ticketId: paymentInfo.external_reference,
          status: ticket?.status
        });
        return NextResponse.json({ message: 'Ticket no encontrado o ya procesado' }, { status: 200 });
      }

      // Actualizar el ticket
      ticket.status = 'PAID';
      ticket.paymentId = String(paymentInfo.id);
      await ticket.save();

      console.log('Resultado de actualización de ticket:', {
        ticketId: ticket._id,
        newStatus: ticket.status,
        paymentId: ticket.paymentId
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
        }
      );

      console.log('Asientos actualizados:', {
        matched: seatResult.matchedCount,
        modified: seatResult.modifiedCount,
        seats: ticket.seats
      });

      return NextResponse.json({
        success: true,
        message: 'Webhook procesado exitosamente',
        data: {
          ticketId: ticket._id,
          paymentId: ticket.paymentId,
          status: paymentInfo.status
        }
      }, { status: 200 });
    }
    // Si el pago es rechazado o cancelado
    else if (paymentInfo.status === 'rejected' || paymentInfo.status === 'cancelled') {
      const ticket = await Ticket.findById(paymentInfo.external_reference);
      if (!ticket || ticket.status !== 'PENDING') {
        console.log('Ticket no encontrado o ya procesado para pago fallido:', {
          ticketId: paymentInfo.external_reference,
          status: ticket?.status
        });
        return NextResponse.json({ message: 'Ticket no encontrado o ya procesado' }, { status: 200 });
      }

      // Actualizar el ticket
      ticket.status = 'FAILED';
      ticket.paymentId = String(paymentInfo.id);
      await ticket.save();

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
        }
      );

      console.log('Asientos liberados por pago fallido:', {
        ticketId: ticket._id,
        paymentId: String(paymentInfo.id),
        seats: ticket.seats,
        seatsUpdated: seatResult.modifiedCount
      });

      return NextResponse.json({
        success: true,
        message: 'Webhook procesado exitosamente',
        data: {
          ticketId: ticket._id,
          paymentId: String(paymentInfo.id),
          status: paymentInfo.status
        }
      }, { status: 200 });
    }

    // Si el estado de pago no es ni aprobado ni rechazado/cancelado, ignorar
    console.log('Webhook ignorado, estado de pago no válido:', paymentInfo.status);
    return NextResponse.json({ message: 'Webhook ignorado' }, { status: 200 });

  } catch (error) {
    console.error('Error procesando webhook:', error);
    return NextResponse.json(
      { error: 'Error al procesar el webhook' },
      { status: 200 }
    );
  }
}