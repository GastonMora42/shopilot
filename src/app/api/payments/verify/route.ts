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
    id: ticket._id,
    eventName: ticket.eventId.name,
    date: ticket.eventId.date,
    location: ticket.eventId.location,
    status: ticket.status,
    buyerInfo: ticket.buyerInfo,
    qrTickets: ticket.qrTickets,
    price: ticket.price,
    paymentId: ticket.paymentId
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

    if (!ticketId) {
      return NextResponse.json(
        { error: 'ID de ticket requerido' },
        { status: 400 }
      );
    }

    await dbConnect();
    
    // Primero verificar si el ticket existe, sin transacción
    const ticketExists = await Ticket.exists({ _id: ticketId });
    
    if (!ticketExists) {
      return NextResponse.json(
        { success: false, ticketExists: false, error: 'Ticket no encontrado' },
        { status: 404 }
      );
    }
    
    // Si el ticket existe, obtener sus detalles
    const ticket = await Ticket.findById(ticketId).populate('eventId');
    
    if (!ticket) {
      return NextResponse.json(
        { success: false, ticketExists: false, error: 'Ticket no encontrado' },
        { status: 404 }
      );
    }
    
    // Si el ticket ya está pagado, devolver directamente la información
    if (ticket.status === 'PAID') {
      console.log('Ticket ya pagado, retornando información:', ticket._id);
      return NextResponse.json({
        success: true,
        ticketExists: true,
        ticket: formatTicketForEmail(ticket)
      });
    }
    
    // Si el ticket está pendiente y no tenemos payment_id, informar pero no es error
    if (ticket.status === 'PENDING' && (!paymentId || paymentId === 'redirect_success')) {
      console.log('Ticket pendiente, esperando webhook:', ticket._id);
      return NextResponse.json({
        success: false, 
        ticketExists: true,
        ticket: {
          id: ticket._id,
          status: 'PENDING',
          eventName: ticket.eventId.name,
          date: ticket.eventId.date
        },
        message: 'El pago aún está siendo procesado por MercadoPago'
      });
    }
    
    // Si estamos aquí, tenemos ticket pendiente y payment_id, proceder con la transacción
    session = await mongoose.startSession();
    await session.startTransaction();
    
    // Recargar el ticket con la sesión
    const ticketForUpdate = await Ticket.findById(ticketId)
      .populate('eventId')
      .session(session);
    
    // Verificar nuevamente el estado (podría haber cambiado)
    if (ticketForUpdate.status === 'PAID') {
      await session.abortTransaction();
      return NextResponse.json({
        success: true,
        ticketExists: true,
        ticket: formatTicketForEmail(ticketForUpdate)
      });
    }
    
    if (ticketForUpdate.status !== 'PENDING') {
      await session.abortTransaction();
      return NextResponse.json({
        success: false,
        ticketExists: true,
        ticket: {
          id: ticketForUpdate._id,
          status: ticketForUpdate.status
        },
        error: `Ticket en estado inválido: ${ticketForUpdate.status}`
      });
    }
    
    console.log('Procesando pago manual para ticket:', ticketForUpdate._id);

    // Generar QRs individuales
    const qrTickets = await generateTicketQRs({
      ticketId: ticketForUpdate._id.toString(),
      eventType: ticketForUpdate.eventType,
      seats: ticketForUpdate.seats,
      ticketType: ticketForUpdate.ticketType,
      quantity: ticketForUpdate.quantity
    });

    // Actualizar ticket con QRs individuales
    ticketForUpdate.qrTickets = qrTickets;
    ticketForUpdate.status = 'PAID';
    ticketForUpdate.paymentId = paymentId;

    // Marcar todos los QRs como pagados
    ticketForUpdate.qrTickets.forEach((qrTicket: { qrMetadata: { status: string; }; }) => {
      qrTicket.qrMetadata.status = 'PAID';
    });

    await ticketForUpdate.save({ session });

    // Actualizar asientos si es necesario
    if (ticketForUpdate.eventType === 'SEATED' && ticketForUpdate.seats?.length) {
      const seatResult = await Seat.updateMany(
        {
          eventId: ticketForUpdate.eventId._id,
          seatId: { $in: ticketForUpdate.seats },
          status: 'RESERVED'
        },
        {
          $set: { 
            status: 'OCCUPIED',
            ticketId: ticketForUpdate._id
          },
          $unset: {
            temporaryReservation: 1,
            lastReservationAttempt: 1
          }
        },
        { session }
      );

      // En vez de lanzar un error, loguear y continuar
      if (seatResult.modifiedCount !== ticketForUpdate.seats.length) {
        console.warn('No se pudieron actualizar todos los asientos:', {
          expected: ticketForUpdate.seats.length,
          updated: seatResult.modifiedCount
        });
      }
    }

    await session.commitTransaction();
    console.log('Pago procesado manualmente con éxito:', ticketForUpdate._id);

    // Formatear ticket para respuesta y email
    const formattedTicket = formatTicketForEmail(ticketForUpdate);

    // Enviar email (sin bloquear respuesta)
    try {
      await sendTicketEmail({
        ticket: formattedTicket,
        email: ticketForUpdate.buyerInfo.email
      });
      console.log('Email enviado exitosamente a:', ticketForUpdate.buyerInfo.email);
    } catch (emailError) {
      console.error('Error al enviar email:', {
        error: emailError,
        ticketId: ticketForUpdate._id,
        email: ticketForUpdate.buyerInfo.email
      });
    }

    return NextResponse.json({
      success: true,
      ticketExists: true,
      manuallyProcessed: true,
      ticket: {
        id: ticketForUpdate._id,
        eventName: ticketForUpdate.eventId.name,
        date: ticketForUpdate.eventId.date,
        location: ticketForUpdate.eventId.location,
        status: 'PAID',
        eventType: ticketForUpdate.eventType,
        qrTickets: ticketForUpdate.qrTickets.map((qr: { qrMetadata: { subTicketId: any; status: any; seatInfo: any; generalInfo: any; }; qrCode: any; qrValidation: any; }) => ({
          subTicketId: qr.qrMetadata.subTicketId,
          qrCode: qr.qrCode,
          qrValidation: qr.qrValidation,
          status: qr.qrMetadata.status,
          ...(ticketForUpdate.eventType === 'SEATED'
            ? { seatInfo: qr.qrMetadata.seatInfo }
            : { generalInfo: qr.qrMetadata.generalInfo }
          )
        })),
        buyerInfo: ticketForUpdate.buyerInfo,
        price: ticketForUpdate.price,
        ...(ticketForUpdate.eventType === 'SEATED'
          ? { seats: ticketForUpdate.seats }
          : {
              ticketType: ticketForUpdate.ticketType,
              quantity: ticketForUpdate.quantity
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