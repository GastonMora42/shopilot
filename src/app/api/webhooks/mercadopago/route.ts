// app/api/webhooks/mercadopago/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Solo procesar notificaciones de pago
    if (data.type !== 'payment') {
      return NextResponse.json({ message: 'Notificación ignorada' });
    }

    await dbConnect();

    const ticketId = data.data.external_reference;
    const paymentStatus = data.data.status;

    // Buscar y actualizar el ticket
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      console.error('Ticket no encontrado:', ticketId);
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    // Actualizar estado según el pago
    if (paymentStatus === 'approved') {
      ticket.status = 'PAID';
      ticket.paymentId = data.data.id;
      await ticket.save();
      
      console.log('Ticket actualizado a PAID:', ticketId);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error procesando webhook:', error);
    return NextResponse.json(
      { error: 'Error procesando webhook' },
      { status: 500 }
    );
  }
}