// app/api/webhooks/mercadopago/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Payment, MercadoPagoConfig } from 'mercadopago';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (body.type !== 'payment') {
      return NextResponse.json({ message: 'Notificación ignorada' });
    }

    await dbConnect();

    const client = new MercadoPagoConfig({ 
      accessToken: process.env.MP_ACCESS_TOKEN! 
    });
    const payment = new Payment(client);
    
    // Obtener detalles del pago
    const paymentData = await payment.get({ id: body.data.id });
    const ticketId = paymentData.external_reference;
    const status = paymentData.status;

    // Actualizar ticket
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket no encontrado');
    }

    if (status === 'approved') {
      ticket.status = 'PAID';
      ticket.paymentId = body.data.id;
      await ticket.save();
    } else if (status === 'rejected' || status === 'cancelled') {
      ticket.status = 'CANCELLED';
      await ticket.save();
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Error procesando webhook' },
      { status: 500 }
    );
  }
}