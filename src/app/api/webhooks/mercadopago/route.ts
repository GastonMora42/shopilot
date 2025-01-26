// api/webhooks/mercadopago/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import { Event } from '@/app/models/Event';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { sendTicketEmail } from '@/app/lib/email';
import mongoose from 'mongoose';
import { generateTicketQRs } from '@/app/lib/qrGenerator';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

const payment = new Payment(client);

type PaymentInfo = {
  id: string | number;
  status: string;
  external_reference: string;
};

function formatTicketsForEmail(ticket: any) {
  // Usar los QRs existentes para formatear el ticket
  return {
    eventName: ticket.eventId.name,
    date: ticket.eventId.date,
    location: ticket.eventId.location,
    status: ticket.status,
    buyerInfo: ticket.buyerInfo,
    eventType: ticket.eventType,
    qrTickets: ticket.qrTickets,
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
}

export async function POST(req: Request) {
  let session: mongoose.ClientSession | null = null;

  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      throw new Error('MP_ACCESS_TOKEN no configurado');
    }

    const body: { data: { id: string } } = await req.json();
    console.log('Webhook recibido:', body);

    if (!body.data?.id) {
      console.log('Webhook ignorado - falta ID de pago');
      return NextResponse.json({ message: 'Webhook ignorado' }, { status: 200 });
    }

    const paymentInfo = await payment.get({ id: body.data.id }) as unknown as PaymentInfo;

    if (!paymentInfo || !paymentInfo.id || !paymentInfo.status || !paymentInfo.external_reference) {
      console.error('Información de pago incompleta:', paymentInfo);
      return NextResponse.json({ error: 'Información de pago incompleta' }, { status: 200 });
    }

    console.log('Información del pago:', {
      paymentId: String(paymentInfo.id),
      status: paymentInfo.status,
      external_reference: paymentInfo.external_reference
    });

    await dbConnect();
    session = await mongoose.startSession();
    await session.startTransaction();

    const ticket = await Ticket.findById(paymentInfo.external_reference)
      .session(session)
      .populate('eventId');

    if (!ticket) {
      throw new Error('Ticket no encontrado');
    }

    console.log('Ticket encontrado:', {
      ticketId: ticket._id,
      currentStatus: ticket.status,
      eventType: ticket.eventType
    });

// En la parte del procesamiento del pago...
if (paymentInfo.status === "approved") {
  if (ticket.status !== 'PENDING') {
    throw new Error('Ticket ya procesado');
  }

  // Actualizar estado de todos los QRs existentes
  ticket.qrTickets.forEach((qrTicket: { qrMetadata: { status: string; }; }) => {
    qrTicket.qrMetadata.status = 'PAID';
  });

  ticket.status = 'PAID';
  ticket.paymentId = String(paymentInfo.id);
  await ticket.save({ session });


      // Actualizar según tipo de ticket
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

        if (seatResult.modifiedCount !== ticket.seats.length) {
          throw new Error('Error al actualizar asientos');
        }
      } else {
        await Event.findByIdAndUpdate(
          ticket.eventId._id,
          {
            $inc: {
              'generalTickets.$[elem].quantity': -ticket.quantity
            }
          },
          {
            arrayFilters: [{ 'elem.name': ticket.ticketType.name }],
            session
          }
        );
      }

      await session.commitTransaction();

      // Formatear tickets y enviar email
      const formattedTicket = formatTicketsForEmail(ticket);
  
      try {
        await sendTicketEmail({
          ticket: formattedTicket, // Ahora pasamos un solo ticket con sus QRs
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
        message: 'Pago procesado exitosamente',
        data: {
          ticketId: ticket._id,
          status: 'PAID',
          qrTickets: ticket.qrTickets.map((qt: { qrMetadata: { subTicketId: any; status: any; }; qrCode: any; qrValidation: any; }) => ({
            subTicketId: qt.qrMetadata.subTicketId,
            qrCode: qt.qrCode,
            qrValidation: qt.qrValidation,
            status: qt.qrMetadata.status
          }))
        }
      });

    } else if (['rejected', 'cancelled', 'refunded'].includes(paymentInfo.status)) {
      // Actualizar estado de todos los QRs a CANCELLED
      ticket.qrTickets.forEach((qrTicket: { qrMetadata: { status: string; }; }) => {
        qrTicket.qrMetadata.status = 'CANCELLED';
      });

      ticket.status = 'CANCELLED';
      ticket.paymentId = String(paymentInfo.id);
      await ticket.save({ session });

      if (ticket.eventType === 'SEATED') {
        await Seat.updateMany(
          {
            eventId: ticket.eventId._id,
            seatId: { $in: ticket.seats },
            status: 'RESERVED'
          },
          {
            $set: { status: 'AVAILABLE' },
            $unset: {
              ticketId: 1,
              temporaryReservation: 1
            }
          },
          { session }
        );
      } else {
        await Event.findByIdAndUpdate(
          ticket.eventId._id,
          {
            $inc: {
              'generalTickets.$[elem].quantity': ticket.quantity
            }
          },
          {
            arrayFilters: [{ 'elem.name': ticket.ticketType.name }],
            session
          }
        );
      }

      await session.commitTransaction();
      return NextResponse.json({
        success: true,
        message: 'Pago cancelado/rechazado',
        data: { 
          ticketId: ticket._id,
          status: 'CANCELLED',
          qrTickets: ticket.qrTickets.map((qt: { qrMetadata: { subTicketId: any; status: any; }; }) => ({
            subTicketId: qt.qrMetadata.subTicketId,
            status: qt.qrMetadata.status
          }))
        }
      });
    }

    await session.commitTransaction();
    return NextResponse.json({
      success: true,
      message: 'Webhook procesado',
      data: {
        ticketId: ticket._id,
        status: ticket.status,
        qrTickets: ticket.qrTickets.map((qt: { qrMetadata: { subTicketId: any; status: any; }; }) => ({
          subTicketId: qt.qrMetadata.subTicketId,
          status: qt.qrMetadata.status
        }))
      }
    });

  } catch (error) {
    if (session) await session.abortTransaction();
    console.error('Error en webhook:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error procesando webhook'
    }, { status: 200 }); // Mantener 200 para MP
  } finally {
    if (session) await session.endSession();
  }
}