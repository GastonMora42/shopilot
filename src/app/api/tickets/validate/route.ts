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
    const data = await req.json();
    const { qrString, manualId } = data;
    
    // Modo de operación: QR escaneado o ID manual
    const isManualMode = !!manualId;
    
    if (!qrString && !manualId) {
      return NextResponse.json({
        success: false,
        message: 'Se requiere un código QR o un ID de ticket'
      }, { status: 400 });
    }
    
    await session.startTransaction();

    // Buscar el ticket según el modo
    let ticket;
    let qrTicket;
    
    if (isManualMode) {
      console.log('Validación manual con ID:', manualId);
      
      // Buscar por ID parcial (permitir búsquedas parciales)
      ticket = await Ticket.findOne({
        'qrTickets.qrMetadata.subTicketId': { $regex: manualId, $options: 'i' }
      }).populate('eventId').session(session);
      
      if (!ticket) {
        throw new Error('Ticket no encontrado');
      }
      
      // Encontrar el QR específico
      qrTicket = ticket.qrTickets.find(
        (qt: { qrMetadata: { subTicketId: string; }; }) => 
          qt.qrMetadata.subTicketId.includes(manualId)
      );
      
      if (!qrTicket) {
        throw new Error('QR no encontrado en el ticket');
      }
    } else {
      // Validación normal por QR escaneado
      console.log('QR Recibido para validación:', {
        qrString,
        parsed: JSON.parse(qrString)
      });

      const qrValidation = validateQR(qrString);
      console.log('Resultado de validación:', {
        isValid: qrValidation.isValid,
        error: qrValidation.error,
        validationData: qrValidation.data
      });
      
      if (!qrValidation.isValid || !qrValidation.data) {
        return NextResponse.json({
          success: false,
          message: qrValidation.error || 'QR inválido'
        }, { status: 400 });
      }

      const validationData = qrValidation.data;
      ticket = await Ticket.findById(validationData.ticketId)
        .populate('eventId')
        .session(session);

      if (!ticket) {
        throw new Error('Ticket no encontrado');
      }
      
      qrTicket = ticket.qrTickets.find(
        (qt: { qrMetadata: { subTicketId: string; }; }) => 
          qt.qrMetadata.subTicketId === validationData.subTicketId
      );
      
      if (!qrTicket) {
        throw new Error('QR no encontrado en el ticket');
      }
    }

    // Verificar fecha del evento y fecha de finalización
    const eventDate = new Date(ticket.eventId.date);
    const eventEndDate = ticket.eventId.endDate ? new Date(ticket.eventId.endDate) : null;
    const now = new Date();
    
    // Si hay fecha de finalización, verificar si el evento ya terminó
    if (eventEndDate && now > eventEndDate) {
      throw new Error('El evento ya ha finalizado');
    }
    
    // Si no hay fecha de finalización, usar la lógica anterior
    // Verificar que el evento haya iniciado (solo si no hay fecha de finalización)
    if (!eventEndDate && now < eventDate) {
      throw new Error('El evento aún no ha comenzado');
    }

    // Verificar estado del QR
    if (qrTicket.qrMetadata.status !== 'PAID') {
      return NextResponse.json({
        success: false,
        message: `Ticket no válido - Estado: ${qrTicket.qrMetadata.status}`,
        ticket: {
          eventName: ticket.eventId.name,
          buyerName: ticket.buyerInfo.name,
          status: qrTicket.qrMetadata.status,
          eventStart: eventDate.toISOString(),
          eventEnd: eventEndDate ? eventEndDate.toISOString() : undefined,
          usedAt: qrTicket.qrMetadata.status === 'USED' ? ticket.updatedAt : undefined
        }
      }, { status: 400 });
    }

    // Verificar si el QR ya fue utilizado
    if (qrTicket.qrMetadata.status === 'USED') {
      return NextResponse.json({
        success: false,
        message: 'Este ticket ya ha sido utilizado',
        ticket: {
          eventName: ticket.eventId.name,
          buyerName: ticket.buyerInfo.name,
          status: 'USED',
          usedAt: ticket.updatedAt
        }
      }, { status: 400 });
    }

    // Actualizar estado del QR específico
    qrTicket.qrMetadata.status = 'USED';
    qrTicket.qrMetadata.usedAt = now;
    
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
        { session, new: true }
      );

      if (!seatResult) {
        console.warn('No se pudo actualizar el estado del asiento, pero el ticket se validó correctamente');
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
        eventDate: eventDate.toISOString(),
        eventEndDate: eventEndDate ? eventEndDate.toISOString() : undefined,
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
        validatedAt: now,
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

interface BaseTicketResponse {
  eventName: string;
  eventDate: string;
  eventEndDate?: string;
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