// app/api/payments/verify/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';

export async function POST(req: Request) {
  try {
    const { ticketId, paymentId } = await req.json();
    
    console.log('Verifying payment:', { ticketId, paymentId });

    if (!ticketId || !paymentId) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Buscar y actualizar el tickets
    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      {
        status: 'PAID',
        paymentId
      },
      { new: true, populate: 'eventId' }
    );

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 }
      );
    }

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