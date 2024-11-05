// app/api/payments/webhook/route.ts
import { NextResponse } from 'next/server';
import { Payment } from 'mercadopago';
import dbConnect from '@/app/lib/mongodb';
import { mpClient } from '@/app/lib/mercadopago';
import { Ticket } from '@/app/models/Ticket';
import { Event } from '@/app/models/Event';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Verificar que sea una notificación de pago
    if (body.type !== 'payment') {
      return NextResponse.json({ message: 'OK' });
    }

    await dbConnect();

    // Obtener detalles del pago
    const payment = await new Payment(mpClient).get({ id: body.data.id });
    const ticketId = payment.external_reference;

    if (payment.status === 'approved') {
      // Actualizar ticket
      const ticket = await Ticket.findByIdAndUpdate(
        ticketId,
        {
          status: 'PAID',
          paymentId: payment.id
        },
        { new: true }
      );

      // Actualizar asientos disponibles del evento
      await Event.findByIdAndUpdate(
        ticket.eventId,
        { $inc: { availableSeats: -1 } }
      );

      // Aquí podrías enviar un email de confirmación con el QR
    }

    return NextResponse.json({ message: 'OK' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}