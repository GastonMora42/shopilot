// api/payments/verify/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import mongoose from 'mongoose';
import { sendTicketEmail, TicketInfo } from '@/app/lib/email';
import crypto from 'crypto';

interface EventDocument {
  _id: mongoose.Types.ObjectId;
  name: string;
  date: string;
  location: string;
}

interface TicketDocument {
  _id: mongoose.Types.ObjectId;
  eventId: EventDocument;
  eventType: 'SEATED' | 'GENERAL';
  seats?: string[];
  ticketType?: {
    name: string;
    price: number;
  };
  quantity?: number;
  buyerInfo: {
    name: string;
    email: string;
  };
  status: string;
  price: number;
  paymentId?: string;
}

// Función auxiliar para generar QRs según tipo de ticket
const generateTicketsWithQRs = (ticket: TicketDocument): TicketInfo[] => {
  if (ticket.eventType === 'SEATED') {
    return ticket.seats?.map(seat => ({
      eventName: ticket.eventId.name,
      date: ticket.eventId.date,
      location: ticket.eventId.location,
      eventType: 'SEATED' as const,
      seat,
      qrCode: crypto
        .createHash('sha256')
        .update(`${ticket._id}-${seat}-${Date.now()}`)
        .digest('hex')
    })) || [];
  } else {
    return Array(ticket.quantity || 0).fill(null).map((_, index) => ({
      eventName: ticket.eventId.name,
      date: ticket.eventId.date,
      location: ticket.eventId.location,
      eventType: 'GENERAL' as const,
      ticketType: ticket.ticketType!,
      qrCode: crypto
        .createHash('sha256')
        .update(`${ticket._id}-${ticket.ticketType?.name}-${index}-${Date.now()}`)
        .digest('hex')
    }));
  }
};

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
    session.startTransaction();

    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      {
        status: 'PAID',
        paymentId
      },
      {
        new: true,
        populate: 'eventId',
        session
      }
    ).lean() as unknown as TicketDocument;

    if (!ticket) {
      await session.abortTransaction();
      console.log('Ticket no encontrado:', ticketId);
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 }
      );
    }

    console.log('Ticket actualizado:', {
      id: ticket._id,
      status: ticket.status,
      eventType: ticket.eventType
    });

    if (ticket.eventType === 'SEATED') {
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

      if (seatResult.modifiedCount !== (ticket.seats?.length || 0)) {
        await session.abortTransaction();
        console.error('Error en actualización de asientos:', {
          expected: ticket.seats?.length,
          updated: seatResult.modifiedCount
        });
        return NextResponse.json({
          error: 'Error al actualizar el estado de los asientos'
        }, { status: 500 });
      }
    }

    await session.commitTransaction();

    // Generar QRs y enviar email
    const ticketsWithQRs = generateTicketsWithQRs(ticket);

    try {
      await sendTicketEmail({
        tickets: ticketsWithQRs,
        email: ticket.buyerInfo.email
      });
      console.log('Email enviado exitosamente a:', ticket.buyerInfo.email);
    } catch (emailError) {
      console.error('Error al enviar email:', emailError);
    }

    return NextResponse.json({
      success: true,
      tickets: ticketsWithQRs
    });

  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    console.error('Error en verificación:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al verificar el pago'
    }, { status: 500 });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}