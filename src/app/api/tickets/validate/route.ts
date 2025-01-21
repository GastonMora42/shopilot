// app/api/tickets/validate/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import { Event } from '@/app/models/Event'; 
import mongoose from 'mongoose';
import { validateQR, type QRData } from '@/app/lib/qrGenerator';

export async function POST(req: Request) {
  let session: mongoose.ClientSession | null = null;
 
  try {
    await dbConnect();
    const { qrString } = await req.json();
    
    if (!qrString) {
      return NextResponse.json({
        success: false,
        message: 'Código QR requerido'
      }, { status: 400 });
    }

    // Validar estructura del QR
    const qrValidation = validateQR(qrString);
    if (!qrValidation.isValid || !qrValidation.data) {
      return NextResponse.json({
        success: false,
        message: qrValidation.error || 'QR inválido'
      }, { status: 400 });
    }

    const qrData = qrValidation.data;

    session = await mongoose.startSession();
    await session.startTransaction();

    const ticket = await Ticket.findById(qrData.ticketId)
      .populate('eventId')
      .session(session);

    if (!ticket) {
      await session.abortTransaction();
      return NextResponse.json({
        success: false,
        message: 'Ticket no encontrado'
      }, { status: 404 });
    }

    // Validar fecha del evento
    const eventDate = new Date(ticket.eventId.date);
    const now = new Date();
    
    if (eventDate < now) {
      await session.abortTransaction();
      return NextResponse.json({
        success: false,
        message: 'El evento ya ha finalizado'
      }, { status: 400 });
    }

    // Validar estado del ticket
    if (ticket.status === 'USED') {
      await session.abortTransaction();
      return NextResponse.json({
        success: false,
        message: 'Ticket ya utilizado',
        ticket: {
          eventName: ticket.eventId.name,
          buyerName: ticket.buyerInfo.name,
          status: ticket.status,
          usedAt: ticket.updatedAt
        }
      }, { status: 400 });
    }

    if (ticket.status !== 'PAID') {
      await session.abortTransaction();
      return NextResponse.json({
        success: false,
        message: `Ticket no válido - Estado: ${ticket.status}`,
        ticket: {
          eventName: ticket.eventId.name,
          buyerName: ticket.buyerInfo.name,
          status: ticket.status
        }
      }, { status: 400 });
    }

    // Verificar que el QR corresponda al ticket
    if (qrData.validationHash !== ticket.qrValidation) {
      await session.abortTransaction();
      return NextResponse.json({
        success: false,
        message: 'QR inválido o manipulado'
      }, { status: 400 });
    }

    // Actualizar ticket
    ticket.status = 'USED';
    await ticket.save({ session });

    // Manejar según el tipo de ticket
    if (ticket.eventType === 'SEATED') {
      const seatResult = await Seat.updateMany(
        {
          eventId: ticket.eventId._id,
          seatId: { $in: ticket.seats },
          status: 'OCCUPIED',
          ticketId: ticket._id
        },
        {
          $set: { status: 'USED' }
        },
        { session }
      );

      if (seatResult.modifiedCount !== ticket.seats.length) {
        await session.abortTransaction();
        return NextResponse.json({
          success: false,
          message: 'Error al validar asientos'
        }, { status: 500 });
      }
    }

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
              seats: ticket.seats.join(', '),
              seatInfo: qrData.metadata.seatInfo
            }
          : { 
              ticketType: ticket.ticketType?.name,
              quantity: ticket.quantity,
              generalInfo: qrData.metadata.generalInfo
            }),
        status: 'USED',
        validatedAt: new Date(),
        dni: ticket.buyerInfo.dni
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    if (session) await session.abortTransaction();
    console.error('Error validating ticket:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Error al validar ticket'
    }, { status: 500 });
  } finally {
    if (session) await session.endSession();
  }
}