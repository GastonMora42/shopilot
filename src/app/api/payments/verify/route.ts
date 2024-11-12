import { Seat } from "@/app/models/Seat";
import { Ticket } from "@/app/models/Ticket";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { ticketId, paymentId } = await req.json();

    // Verificar y actualizar ticket
    const ticket = await Ticket.findOneAndUpdate(
      {
        _id: ticketId,
        status: 'PENDING'
      },
      {
        status: 'PAID',
        paymentId
      },
      { 
        new: true, 
        session,
        populate: 'eventId'
      }
    );

    if (!ticket) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: 'Ticket no encontrado o ya procesado' },
        { status: 404 }
      );
    }

    // Confirmar asientos
    const seatResult = await Seat.updateMany(
      {
        eventId: ticket.eventId,
        number: { $in: ticket.seats },
        status: 'RESERVED',
        ticketId: ticket._id
      },
      {
        $set: { status: 'OCCUPIED' },
        $unset: {
          temporaryReservation: 1,
          reservationExpires: 1
        }
      },
      { session }
    );

    if (seatResult.modifiedCount !== ticket.seats.length) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: 'Error actualizando asientos' },
        { status: 500 }
      );
    }

    await session.commitTransaction();
    return NextResponse.json({
      success: true,
      ticket: {
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
      }
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al verificar el pago'
    }, { status: 500 });
  }
}