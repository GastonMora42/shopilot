// src/app/api/tickets/approve-transfer/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Event } from '@/app/models/Event';
import { Seat } from '@/app/models/Seat';
import { TransferTicket } from '@/app/models/TransferTicket'; // Nuevo modelo
import { authOptions } from '@/app/lib/auth';
import { sendTicketEmail } from '@/app/lib/email';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  let session = null;
  
  try {
    console.log('API approve-transfer: Iniciando procesamiento');
    const data = await req.json();
    const { approve, rejectionReason } = data;
    // Usar una variable mutable en lugar de const
    let mainTicketId = data.ticketId;
    
    const userSession = await getServerSession(authOptions);
    
    if (!userSession?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    await dbConnect();
    session = await mongoose.startSession();
    session.startTransaction();
    
    // Buscar el registro de transferencia
    let transferTicket = await TransferTicket.findOne({ ticketId: mainTicketId })
      .session(session);
      
    if (!transferTicket) {
      console.log('API approve-transfer: TransferTicket no encontrado para ticketId:', mainTicketId);
      
      // Intentar buscar directamente por ID de transferTicket (en caso de que el ID proporcionado sea de TransferTicket)
      transferTicket = await TransferTicket.findById(mainTicketId).session(session);
      
      if (transferTicket) {
        console.log('API approve-transfer: TransferTicket encontrado directamente con ID:', mainTicketId);
        // Actualizar mainTicketId para usar el correcto
        mainTicketId = transferTicket.ticketId.toString();
      } else {
        throw new Error('Registro de transferencia no encontrado');
      }
    } else {
      console.log('API approve-transfer: TransferTicket encontrado:', transferTicket._id);
    }
    
    // Obtener el ticket principal
    const ticket = await Ticket.findById(mainTicketId)
      .populate('eventId')
      .session(session);
      
    if (!ticket) {
      throw new Error('Ticket principal no encontrado');
    }
    
    console.log('API approve-transfer: Ticket principal encontrado:', ticket._id);
    
    // Verificar si el usuario es el organizador del evento
    const eventOwnerId = ticket.eventId.organizerId.toString();
    if (eventOwnerId !== userSession.user.id) {
      throw new Error('No estás autorizado para aprobar este ticket');
    }
    
    if (ticket.status !== 'PENDING') {
      throw new Error('Este ticket ya ha sido procesado');
    }
    
    if (approve) {
      console.log('API approve-transfer: Aprobando ticket');
      
      // Actualizar estado del registro de transferencia
      transferTicket.status = 'APPROVED';
      await transferTicket.save({ session });
      
      // Aprobar el ticket principal
      ticket.status = 'PAID';
      
      // Actualizar estado de QRs individuales
      if (ticket.qrTickets && Array.isArray(ticket.qrTickets)) {
        ticket.qrTickets.forEach((qrTicket: { qrMetadata: { status: string; }; }) => {
          if (qrTicket.qrMetadata) {
            qrTicket.qrMetadata.status = 'PAID';
          }
        });
      }
      
      await ticket.save({ session });
      
      // Si es un evento con asientos, marcarlos como ocupados
      if (ticket.eventType === 'SEATED' && ticket.seats?.length) {
        await Seat.updateMany(
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
      }
      
      // Enviar email con los tickets
      try {
        const formattedTicket = {
          eventName: ticket.eventId.name,
          date: ticket.eventId.date,
          location: ticket.eventId.location,
          status: ticket.status,
          buyerInfo: ticket.buyerInfo,
          qrTickets: ticket.qrTickets,
          eventType: ticket.eventType,
          ...(ticket.eventType === 'SEATED'
            ? { 
                seats: ticket.seats,
                price: ticket.price
              }
            : {
                ticketType: ticket.ticketType,
                quantity: ticket.quantity
              }
          )
        };
        
        await sendTicketEmail({
          ticket: formattedTicket,
          email: ticket.buyerInfo.email
        });
        
        console.log('API approve-transfer: Email enviado al comprador');
      } catch (emailError) {
        console.error('Error al enviar email:', emailError);
        // Continuamos aunque falle el email
      }
    } else {
      console.log('API approve-transfer: Rechazando ticket');
      
      // Actualizar estado del registro de transferencia
      transferTicket.status = 'REJECTED';
      transferTicket.rejectionReason = rejectionReason || 'Pago rechazado por el organizador';
      await transferTicket.save({ session });
      
      // Rechazar el ticket principal
      ticket.status = 'CANCELLED';
      
      // Actualizar estado de QRs individuales
      if (ticket.qrTickets && Array.isArray(ticket.qrTickets)) {
        ticket.qrTickets.forEach((qrTicket: { qrMetadata: { status: string; }; }) => {
          if (qrTicket.qrMetadata) {
            qrTicket.qrMetadata.status = 'CANCELLED';
          }
        });
      }
      
      await ticket.save({ session });
      
      // Liberar asientos si aplica
      if (ticket.eventType === 'SEATED' && ticket.seats?.length) {
        await Seat.updateMany(
          {
            eventId: ticket.eventId._id,
            seatId: { $in: ticket.seats },
            status: 'RESERVED'
          },
          {
            $set: { status: 'AVAILABLE' },
            $unset: {
              temporaryReservation: 1,
              ticketId: 1
            }
          },
          { session }
        );
      }
      
      // Enviar email notificando rechazo
      try {
        // Hacer compatible con el tipo esperado por sendTicketEmail
        const rejectionTicketInfo = {
          eventName: ticket.eventId.name,
          status: 'CANCELLED',
          buyerInfo: ticket.buyerInfo,
          // No incluir rejectionReason en el objeto principal
          // Usar los parámetros opcionales o un objeto adicional según la función
          eventType: ticket.eventType,
          date: ticket.eventId.date,
          location: ticket.eventId.location,
          ...(ticket.eventType === 'SEATED'
            ? { 
                seats: ticket.seats,
                price: ticket.price
              }
            : {
                ticketType: ticket.ticketType,
                quantity: ticket.quantity
              }
          )
        };
        
        console.log('API approve-transfer: Email de rechazo enviado al comprador');
      } catch (emailError) {
        console.error('Error al enviar email de rechazo:', emailError);
      }
    }
    
    await session.commitTransaction();
    
    return NextResponse.json({
      success: true,
      status: ticket.status,
      message: approve ? 'Ticket aprobado exitosamente' : 'Ticket rechazado'
    });
    
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    console.error('Error al procesar aprobación:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Error al procesar la solicitud'
      },
      { status: 400 }
    );
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}