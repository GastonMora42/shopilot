//api/webhooks/mercadopago/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { sendTicketEmail } from '@/app/lib/email';
import mongoose from 'mongoose';

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
  let session = null;

  try {
    const body: { data: { id: string } } = await req.json();
    console.log('Webhook recibido:', body);

    if (!body.data?.id) {
      console.log('Webhook ignorado - falta ID de pago');
      return NextResponse.json({ message: 'Webhook ignorado' }, { status: 200 });
    }

    const paymentInfo = await payment.get({ id: body.data.id }) as unknown as PaymentInfo;

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
    session = await mongoose.startSession();
    session.startTransaction();

    // Buscar el ticket independientemente del estado del pago
    const ticket = await Ticket.findById(paymentInfo.external_reference)
      .session(session)
      .populate('eventId');

    if (!ticket) {
      if (session) await session.abortTransaction();
      return NextResponse.json({ message: 'Ticket no encontrado' }, { status: 200 });
    }

    console.log('Ticket encontrado:', {
      ticketId: ticket._id,
      currentStatus: ticket.status,
      seats: ticket.seats
    });

    // Manejar pago aprobado
    if (paymentInfo.status === "approved") {
      if (ticket.status !== 'PENDING') {
        await session.abortTransaction();
        return NextResponse.json({ 
          message: 'Ticket ya procesado', 
          currentStatus: ticket.status 
        }, { status: 200 });
      }

      // Actualizar ticket
      ticket.status = 'PAID';
      ticket.paymentId = String(paymentInfo.id);
      await ticket.save({ session });

// Marcar asientos como ocupados
const seatResult = await Seat.updateMany(
  {
    eventId: ticket.eventId,
    seatId: { $in: ticket.seatId },
    status: 'RESERVED'
  },
  {
    $set: { 
      status: 'OCCUPIED',
      ticketId: ticket._id
    },
    $unset: {
      temporaryReservation: 1
    }
  },
  { session }
);

if (seatResult.modifiedCount !== ticket.seats.length) {
  await session.abortTransaction();
  console.error('Error actualizando asientos:', {
    expected: ticket.seats.length,
    updated: seatResult.modifiedCount
  });
  return NextResponse.json({ 
    error: 'Error en la actualización de asientos' 
  }, { status: 200 });
}

      await session.commitTransaction();

      // Enviar email fuera de la transacción
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
    }
    // Manejar pago rechazado o cancelado
    else if (['rejected', 'cancelled', 'refunded'].includes(paymentInfo.status)) {
      if (ticket.status !== 'PENDING') {
        await session.abortTransaction();
        return NextResponse.json({ 
          message: 'Ticket ya procesado', 
          currentStatus: ticket.status 
        }, { status: 200 });
      }

      // Actualizar ticket
      ticket.status = 'CANCELLED';
      ticket.paymentId = String(paymentInfo.id);
      await ticket.save({ session });

      // Liberar asientos reservados
      const seatResult = await Seat.updateMany(
        {
          eventId: ticket.eventId,
          seatId: { $in: ticket.seats },
          status: 'RESERVED'
        },
        {
          $set: { status: 'AVAILABLE' },
          $unset: {
            ticketId: 1,
            temporaryReservation: 1
          }
        },
        { session }
      );

      console.log('Resultado de liberación de asientos:', {
        ticketId: ticket._id,
        seats: ticket.seats,
        updated: seatResult.modifiedCount
      });

      await session.commitTransaction();
    }
    // Estados pendientes o en proceso
    else if (['pending', 'in_process', 'authorized'].includes(paymentInfo.status)) {
      // Mantener los asientos como RESERVED
      console.log('Pago pendiente, manteniendo reserva:', {
        ticketId: ticket._id,
        paymentStatus: paymentInfo.status
      });
      
      // Extender el tiempo de reserva si es necesario
      await Seat.updateMany(
        {
          eventId: ticket.eventId,
          seatId: { $in: ticket.seats },
          status: 'RESERVED'
        },
        {
          $set: {
            'temporaryReservation.expiresAt': new Date(Date.now() + 15 * 60 * 1000)
          }
        },
        { session }
      );

      await session.commitTransaction();
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook procesado exitosamente',
      data: {
        ticketId: ticket._id,
        paymentId: String(paymentInfo.id),
        status: paymentInfo.status,
        ticketStatus: ticket.status
      }
    }, { status: 200 });

  } catch (error) {
    if (session) await session.abortTransaction();
    console.error('Error procesando webhook:', error);
    return NextResponse.json(
      { error: 'Error al procesar el webhook' },
      { status: 200 }
    );
  } finally {
    if (session) await session.endSession();
  }
}