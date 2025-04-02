// src/app/api/tickets/approve-transfer/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Event } from '@/app/models/Event';
import { Seat } from '@/app/models/Seat';
import { authOptions } from '@/app/lib/auth';
import { sendTicketEmail } from '@/app/lib/email';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  let session = null;
  
  try {
    const { ticketId, approve, rejectionReason } = await req.json();
    const userSession = await getServerSession(authOptions);
    
    if (!userSession?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    await dbConnect();
    session = await mongoose.startSession();
    session.startTransaction();
    
    // Obtener el ticket
    const ticket = await Ticket.findById(ticketId)
      .populate('eventId')
      .session(session);
      
    if (!ticket) {
      throw new Error('Ticket no encontrado');
    }
    
    // Verificar si el usuario es el organizador del evento
    const eventOwnerId = ticket.eventId.organizerId.toString();
    if (eventOwnerId !== userSession.user.id) {
      throw new Error('No estás autorizado para aprobar este ticket');
    }
    
    if (ticket.status !== 'PENDING') {
      throw new Error('Este ticket ya ha sido procesado');
    }
    
    if (approve) {
      // Aprobar el ticket
      ticket.status = 'PAID';
      
      // Actualizar estado de QRs individuales
      ticket.qrTickets.forEach((qrTicket: any) => {
        qrTicket.qrMetadata.status = 'PAID';
      });
      
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
      } catch (emailError) {
        console.error('Error al enviar email:', emailError);
        // Continuamos aunque falle el email
      }
    } else {
      // Rechazar el ticket
      ticket.status = 'CANCELLED';
      ticket.rejectionReason = rejectionReason || 'Pago rechazado por el organizador';
      
      // Actualizar estado de QRs individuales
      ticket.qrTickets.forEach((qrTicket: any) => {
        qrTicket.qrMetadata.status = 'CANCELLED';
      });
      
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
      // Implementar esta función según necesidad
    }
    
    await session.commitTransaction();
    
    return NextResponse.json({
      success: true,
      status: ticket.status,
      message: approve ? 'Ticket aprobado exitosamente' : 'Ticket rechazado'
    });
    
  } catch (error) {
    if (session) await session.abortTransaction();
    console.error('Error al procesar aprobación:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Error al procesar la solicitud'
      },
      { status: 400 }
    );
  } finally {
    if (session) await session.endSession();
  }
}