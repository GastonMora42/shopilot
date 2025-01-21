// api/payments/verify/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket, ITicket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import mongoose from 'mongoose';
import { sendTicketEmail, TicketInfo } from '@/app/lib/email';
import { generateTicketQR } from '@/app/lib/utils';

interface EventDocument {
  _id: mongoose.Types.ObjectId;
  name: string;
  date: string;
  location: string;
}

// Función auxiliar para formatear el ticket para el email
function formatTicketForEmail(ticket: ITicket & { eventId: EventDocument }) {
  const baseTicket = {
    eventName: ticket.eventId.name,
    date: ticket.eventId.date,
    location: ticket.eventId.location,
    eventType: ticket.eventType,
    qrCode: ticket.qrCode,
    qrValidation: ticket.qrValidation,
    status: ticket.status,
    buyerInfo: ticket.buyerInfo
  };

  if (ticket.eventType === 'SEATED') {
    return {
      ...baseTicket,
      eventType: 'SEATED' as const,
      seats: ticket.seats
    };
  } else {
    return {
      ...baseTicket,
      eventType: 'GENERAL' as const,
      ticketType: ticket.ticketType,
      quantity: ticket.quantity
    };
  }
}

export async function POST(req: Request) {
  let session: mongoose.ClientSession | null = null;

  try {
    const { ticketId, paymentId } = await req.json();
    console.log('Iniciando verificación de pago:', { ticketId, paymentId });

    if (!ticketId || !paymentId) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    await dbConnect();
    session = await mongoose.startSession();
    await session.startTransaction();

    // Buscar ticket y verificar estado
    const ticket = await Ticket.findById(ticketId)
      .populate('eventId')
      .session(session);

    if (!ticket) {
      throw new Error('Ticket no encontrado');
    }

    if (ticket.status !== 'PENDING') {
      throw new Error(`Ticket en estado inválido: ${ticket.status}`);
    }

    // Generar o recuperar QR
    if (!ticket.qrCode) {
      const { qrCode, qrValidation, qrMetadata } = await generateTicketQR({
        ticketId: ticket._id.toString(),
        eventType: ticket.eventType,
        seats: ticket.seats,
        ticketType: ticket.ticketType,
        quantity: ticket.quantity
      });

      // Actualizar ticket
      ticket.status = 'PAID';
      ticket.paymentId = paymentId;
      ticket.qrCode = qrCode;
      ticket.qrValidation = qrValidation;
      ticket.qrMetadata = qrMetadata;

      await ticket.save({ session });
    }

    // Actualizar asientos si es necesario
    if (ticket.eventType === 'SEATED' && ticket.seats?.length) {
      const seatResult = await Seat.updateMany(
        {
          eventId: ticket.eventId._id,
          seatId: { $in: ticket.seats },
          status: 'RESERVED'
        },
        {
          $set: { 
            status: 'OCCUPIED',
            ticketId: ticket._id
          },
          $unset: {
            temporaryReservation: 1,
            lastReservationAttempt: 1
          }
        },
        { session }
      );

      if (seatResult.modifiedCount !== ticket.seats.length) {
        throw new Error('Error al actualizar el estado de los asientos');
      }
    }

    await session.commitTransaction();

// api/payments/verify/route.ts

function formatTicketForEmail(ticket: ITicket & { eventId: EventDocument }) {
  const baseTicket = {
    eventName: ticket.eventId.name,
    date: ticket.eventId.date,
    location: ticket.eventId.location,
    qrCode: ticket.qrCode,
    status: ticket.status,
    buyerInfo: ticket.buyerInfo
  };

  if (ticket.eventType === 'SEATED') {
    // Para tickets con asientos, creamos un ticket por cada asiento
    return ticket.seats.map(seat => ({
      ...baseTicket,
      eventType: 'SEATED' as const,
      seat // Un ticket por asiento individual
    }));
  } else {
    // Para tickets generales
    return [{
      ...baseTicket,
      eventType: 'GENERAL' as const,
      ticketType: ticket.ticketType,
      quantity: ticket.quantity
    }];
  }
}

// Y luego al enviar el email:
try {
  const formattedTickets = formatTicketForEmail(ticket) as unknown as TicketInfo[];

  await sendTicketEmail({
    tickets: formattedTickets,
    email: ticket.buyerInfo.email
  });
  console.log('Email enviado exitosamente a:', ticket.buyerInfo.email);
} catch (emailError) {
  console.error('Error al enviar email:', emailError);
  // Continuamos incluso si falla el email
}
    // Preparar respuesta
    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket._id,
        eventName: ticket.eventId.name,
        date: ticket.eventId.date,
        location: ticket.eventId.location,
        status: ticket.status,
        eventType: ticket.eventType,
        qrCode: ticket.qrCode,
        qrValidation: ticket.qrValidation,
        buyerInfo: {
          name: ticket.buyerInfo.name,
          email: ticket.buyerInfo.email
        },
        ...(ticket.eventType === 'SEATED'
          ? { seats: ticket.seats }
          : {
              ticketType: ticket.ticketType,
              quantity: ticket.quantity
            }),
        price: ticket.price
      }
    });

  } catch (error) {
    if (session) await session.abortTransaction();
    console.error('Error en verificación:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error al verificar el pago'
    }, { status: 500 });
  } finally {
    if (session) await session.endSession();
  }
}