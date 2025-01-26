// api/tickets/validate/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import mongoose from 'mongoose';
import { validateQR } from '@/app/lib/qrGenerator';

export async function POST(req: Request) {
  const session = await mongoose.startSession();
  
  try {
    const { qrString } = await req.json();
    const qrValidation = validateQR(qrString);
    
    if (!qrValidation.isValid || !qrValidation.data) {
      return NextResponse.json({
        success: false,
        message: qrValidation.error || 'QR inválido'
      }, { status: 400 });
    }

    await session.startTransaction();

    const ticket = await Ticket.findById(qrValidation.data.ticketId)
      .populate('eventId')
      .session(session);

    if (!ticket) {
      throw new Error('Ticket no encontrado');
    }

    // Verificar fecha del evento
    const eventDate = new Date(ticket.eventId.date);
    const now = new Date();
    
    if (eventDate < now) {
      throw new Error('El evento ya ha finalizado');
    }

    if (!qrValidation.isValid || !qrValidation.data) {
      return NextResponse.json({
        success: false,
        message: qrValidation.error || 'QR inválido'
      }, { status: 400 });
    }

    const qrData = qrValidation.data; // TypeScript ahora sabe que data existe
    
    // Buscar el QR específico
    const qrTicket = ticket.qrTickets.find(
      (      qt: { qrMetadata: { subTicketId: string; }; }) => qt.qrMetadata.subTicketId === qrData.subTicketId
    );
    
    if (!qrTicket) {
      throw new Error('QR no encontrado en el ticket');
    }

    if (qrTicket.qrMetadata.status !== 'PAID') {
      return NextResponse.json({
        success: false,
        message: `Ticket no válido - Estado: ${qrTicket.qrMetadata.status}`,
        ticket: {
          eventName: ticket.eventId.name,
          buyerName: ticket.buyerInfo.name,
          status: qrTicket.qrMetadata.status,
          usedAt: qrTicket.qrMetadata.status === 'USED' ? ticket.updatedAt : undefined
        }
      }, { status: 400 });
    }

    // Actualizar estado del QR específico
    qrTicket.qrMetadata.status = 'USED';
    
    // Actualizar estado general del ticket si todos los QR están usados
    if (ticket.qrTickets.every((qt: { qrMetadata: { status: string; }; }) => qt.qrMetadata.status === 'USED')) {
      ticket.status = 'USED';
    }

    // Si es un ticket con asientos, actualizar el estado del asiento
    if (ticket.eventType === 'SEATED' && qrTicket.qrMetadata.seatInfo?.seat) {
      const seatResult = await Seat.findOneAndUpdate(
        {
          eventId: ticket.eventId._id,
          seatId: qrTicket.qrMetadata.seatInfo.seat,
          status: 'OCCUPIED',
          ticketId: ticket._id
        },
        {
          $set: { status: 'USED' }
        },
        { session }
      );

      if (!seatResult) {
        throw new Error('Error al actualizar el estado del asiento');
      }
    }

    await ticket.save({ session });
    await session.commitTransaction();

    // Preparar respuesta
    const response = {
      success: true,
      message: '¡ACCESO PERMITIDO!',
      ticket: {
        eventName: ticket.eventId.name,
        buyerName: ticket.buyerInfo.name,
        eventType: ticket.eventType,
        ...(ticket.eventType === 'SEATED' 
          ? { 
              seat: qrTicket.qrMetadata.seatInfo?.seat,
              seatInfo: qrTicket.qrMetadata.seatInfo
            }
          : { 
              ticketType: ticket.ticketType?.name,
              generalInfo: qrTicket.qrMetadata.generalInfo
            }),
        status: 'USED',
        validatedAt: new Date(),
        qrMetadata: {
          subTicketId: qrTicket.qrMetadata.subTicketId,
          type: qrTicket.qrMetadata.type
        },
        buyerInfo: {
          name: ticket.buyerInfo.name,
          dni: ticket.buyerInfo.dni
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    console.error('Error validating ticket:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Error al validar el ticket'
    }, { status: 500 });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

// Tipos auxiliares para la respuesta
interface BaseTicketResponse {
  eventName: string;
  buyerName: string;
  eventType: 'SEATED' | 'GENERAL';
  status: string;
  validatedAt: Date;
  qrMetadata: {
    subTicketId: string;
    type: 'SEATED' | 'GENERAL';
  };
  buyerInfo: {
    name: string;
    dni: string;
  };
}

interface SeatedTicketResponse extends BaseTicketResponse {
  eventType: 'SEATED';
  seat: string;
  seatInfo: {
    seat: string;
  };
}

interface GeneralTicketResponse extends BaseTicketResponse {
  eventType: 'GENERAL';
  ticketType: string;
  generalInfo: {
    ticketType: string;
    index: number;
  };
}

type TicketResponse = SeatedTicketResponse | GeneralTicketResponse;