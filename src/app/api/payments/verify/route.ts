import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket, ITicket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import mongoose from 'mongoose';
import { sendTicketEmail } from '@/app/lib/email';
import { generateTicketQR } from '@/app/lib/qrGenerator';
import { 
  TicketInfo, 
  SeatedTicketInfo, 
  GeneralTicketInfo 
} from '@/app/lib/email';

interface EventDocument {
  _id: mongoose.Types.ObjectId;
  name: string;
  date: string;
  location: string;
}

// Función para formatear tickets para email y respuesta
// api/payments/verify/route.ts
function formatTicketForEmail(ticket: ITicket & { eventId: EventDocument }): TicketInfo[] {
  const baseTicket = {
    eventName: ticket.eventId.name,
    date: ticket.eventId.date,
    location: ticket.eventId.location,
    status: ticket.status,
    buyerInfo: ticket.buyerInfo,
    price: ticket.price
  };

  if (ticket.eventType === 'SEATED') {
    return ticket.seats.map(seat => ({
      ...baseTicket,
      eventType: 'SEATED' as const,
      seat,
      qrCode: ticket.qrCode,
      qrValidation: ticket.qrValidation
    }));
  } else {
    return [{
      ...baseTicket,
      eventType: 'GENERAL' as const,
      ticketType: ticket.ticketType!,
      quantity: ticket.quantity!,
      qrCode: ticket.qrCode,
      qrValidation: ticket.qrValidation
    }];
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

    if (ticket.status === 'PAID') {
      // Si ya está pagado, retornamos los datos sin error
      const formattedTickets = formatTicketForEmail(ticket);
      return NextResponse.json({
        success: true,
        tickets: formattedTickets
      });
    }

    if (ticket.status !== 'PENDING') {
      throw new Error(`Ticket en estado inválido: ${ticket.status}`);
    }

    const { qrString: qrCode, validationHash: qrValidation, qrData } = await generateTicketQR({
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
    ticket.qrMetadata = qrData;

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

    // Formatear tickets para email y respuesta
    const formattedTickets = formatTicketForEmail(ticket);

    // Enviar email
    try {
      await sendTicketEmail({
        tickets: formattedTickets,
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

    // Retornar respuesta exitosa
    return NextResponse.json({
      success: true,
      tickets: formattedTickets.map(formattedTicket => ({
        id: ticket._id,
        eventName: ticket.eventId.name,
        date: ticket.eventId.date,
        location: ticket.eventId.location,
        status: 'PAID',
        eventType: ticket.eventType,
        qrCode: formattedTicket.qrCode,
        qrValidation: formattedTicket.qrValidation,
        buyerInfo: ticket.buyerInfo,
        price: formattedTicket.price,
        ...(ticket.eventType === 'SEATED'
          ? { seat: (formattedTicket as SeatedTicketInfo).seat }
          : {
              ticketType: (formattedTicket as GeneralTicketInfo).ticketType,
              quantity: (formattedTicket as GeneralTicketInfo).quantity
            })
      }))
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