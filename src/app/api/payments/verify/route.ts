// app/api/payments/verify/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import mongoose from 'mongoose';
import { sendTicketEmail } from '@/app/lib/email';

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

    // Buscar tickets - ahora soporta array de IDs
    const ticketIds = Array.isArray(ticketId) ? ticketId : [ticketId];
    const tickets = await Ticket.find({
      _id: { $in: ticketIds }
    }).populate('eventId').session(session);

    if (tickets.length === 0) {
      await session.abortTransaction();
      console.log('Tickets no encontrados:', ticketIds);
      return NextResponse.json(
        { error: 'Tickets no encontrados' },
        { status: 404 }
      );
    }

    console.log('Tickets encontrados:', tickets.length);

    // Actualizar cada ticket
    const updatedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        ticket.status = 'PAID';
        ticket.paymentId = paymentId;
        return await ticket.save({ session });
      })
    );

    console.log('Tickets actualizados:', updatedTickets.length);

    // Recopilar todos los asientos para actualizar
    const seatsToUpdate = tickets.reduce((acc, ticket) => {
      acc.push(...ticket.seats);
      return acc;
    }, [] as string[]);

    // Actualizar todos los asientos en una sola operación
    const seatResult = await Seat.updateMany(
      {
        eventId: tickets[0].eventId, // Asumimos que todos los tickets son del mismo evento
        seatId: { $in: seatsToUpdate },
        status: 'RESERVED'
      },
      {
        $set: { 
          status: 'OCCUPIED',
          ticketId: tickets[0]._id // Podríamos guardar referencia al ticket específico si es necesario
        },
        $unset: {
          temporaryReservation: 1,
          lastReservationAttempt: 1
        }
      },
      { session }
    );

    console.log('Resultado actualización de asientos:', {
      modifiedCount: seatResult.modifiedCount,
      expectedCount: seatsToUpdate.length
    });

    if (seatResult.modifiedCount !== seatsToUpdate.length) {
      await session.abortTransaction();
      console.error('Error en actualización de asientos:', {
        expected: seatsToUpdate.length,
        updated: seatResult.modifiedCount
      });
      return NextResponse.json({
        error: 'Error al actualizar el estado de los asientos'
      }, { status: 500 });
    }

    await session.commitTransaction();
    console.log('Transacción completada exitosamente');

    // Enviar email para cada ticket
    for (const ticket of updatedTickets) {
      try {
        await sendTicketEmail({
          ticket: {
            eventName: ticket.eventId.name,
            date: ticket.eventId.date,
            location: ticket.eventId.location,
            seats: ticket.seats
          },
          qrCode: ticket.qrCode,
          email: ticket.buyerInfo.email
        });
        console.log('Email enviado exitosamente a:', ticket.buyerInfo.email);
      } catch (emailError) {
        console.error('Error al enviar email:', emailError);
      }
    }

    // Devolver todos los tickets actualizados
    return NextResponse.json({
      success: true,
      tickets: updatedTickets.map(ticket => ({
        id: ticket._id,
        status: ticket.status,
        eventName: ticket.eventId.name,
        date: ticket.eventId.date,
        location: ticket.eventId.location,
        seats: ticket.seats,
        qrCode: ticket.qrCode,
        buyerInfo: ticket.buyerInfo,
        price: ticket.price,
        paymentId: ticket.paymentId
      }))
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