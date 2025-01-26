// api/payments/verify/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket, ITicket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import mongoose from 'mongoose';
import { sendTicketEmail } from '@/app/lib/email';
import { generateTicketQRs } from '@/app/lib/qrGenerator';

interface EventDocument {
  _id: mongoose.Types.ObjectId;
  name: string;
  date: string;
  location: string;
}

interface QRTicket {
  subTicketId: string;
  qrCode: string;
  qrValidation: string;
  qrMetadata: {
    timestamp: number;
    ticketId: string;
    subTicketId: string;
    type: 'SEATED' | 'GENERAL';
    status: 'PENDING' | 'PAID' | 'USED' | 'CANCELLED';
    seatInfo?: {
      seat: string;
    };
    generalInfo?: {
      ticketType: string;
      index: number;
    };
  };
}

function formatTicketForEmail(ticket: ITicket & { eventId: EventDocument }) {
  const baseTicket = {
    eventName: ticket.eventId.name,
    date: ticket.eventId.date,
    location: ticket.eventId.location,
    status: ticket.status,
    buyerInfo: ticket.buyerInfo,
    qrTickets: ticket.qrTickets,
  };

  if (ticket.eventType === 'SEATED') {
    return {
      ...baseTicket,
      eventType: 'SEATED' as const,
      seats: ticket.seats,
      price: ticket.price
    };
  } else {
    return {
      ...baseTicket,
      eventType: 'GENERAL' as const,
      ticketType: ticket.ticketType,
      quantity: ticket.quantity,
      price: ticket.price
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

    const ticket = await Ticket.findById(ticketId)
      .populate('eventId')
      .session(session);

    if (!ticket) {
      throw new Error('Ticket no encontrado');
    }

    if (ticket.status === 'PAID') {
      return NextResponse.json({
        success: true,
        ticket: formatTicketForEmail(ticket)
      });
    }

    if (ticket.status !== 'PENDING') {
      throw new Error(`Ticket en estado inválido: ${ticket.status}`);
    }

    // Generar QRs individuales
    const qrTickets = await generateTicketQRs({
      ticketId: ticket._id.toString(),
      eventType: ticket.eventType,
      seats: ticket.seats,
      ticketType: ticket.ticketType,
      quantity: ticket.quantity
    });

    // Actualizar ticket con QRs individuales
    ticket.qrTickets = qrTickets;
    ticket.status = 'PAID';
    ticket.paymentId = paymentId;

    // Marcar todos los QRs como pagados
    ticket.qrTickets.forEach((qrTicket: { qrMetadata: { status: string; }; }) => {
      qrTicket.qrMetadata.status = 'PAID';
    });

    await ticket.save({ session });

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

    const formattedTicket = formatTicketForEmail(ticket);

try {
  const emailTicket = formatTicketForEmail(ticket);
  await sendTicketEmail({
    ticket: emailTicket,
    email: ticket.buyerInfo.email
  });
  console.log('Email enviado exitosamente a:', ticket.buyerInfo.email);
} catch (emailError) {
  console.error('Error al enviar email:', {
    error: emailError,
    ticketId: ticket._id,
    email: ticket.buyerInfo.email
  });
}
    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket._id,
        eventName: ticket.eventId.name,
        date: ticket.eventId.date,
        location: ticket.eventId.location,
        status: 'PAID',
        eventType: ticket.eventType,
        qrTickets: ticket.qrTickets.map((qr: { qrMetadata: { subTicketId: any; status: any; seatInfo: any; generalInfo: any; }; qrCode: any; qrValidation: any; }) => ({
          subTicketId: qr.qrMetadata.subTicketId,
          qrCode: qr.qrCode,
          qrValidation: qr.qrValidation,
          status: qr.qrMetadata.status,
          ...(ticket.eventType === 'SEATED'
            ? { seatInfo: qr.qrMetadata.seatInfo }
            : { generalInfo: qr.qrMetadata.generalInfo }
          )
        })),
        buyerInfo: ticket.buyerInfo,
        price: ticket.price,
        ...(ticket.eventType === 'SEATED'
          ? { seats: ticket.seats }
          : {
              ticketType: ticket.ticketType,
              quantity: ticket.quantity
            }
        )
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