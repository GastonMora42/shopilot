// app/api/webhooks/mercadopago/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { sendTicketEmail } from '@/app/lib/email';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    if (data.type !== 'payment') {
      return NextResponse.json({ message: 'Notificación ignorada' });
    }

    await dbConnect();
    const ticketId = data.data.external_reference;
    const paymentStatus = data.data.status;

    // Buscar ticket y evento
    const ticket = await Ticket.findById(ticketId).populate('eventId');
    if (!ticket) {
      console.error('Ticket no encontrado:', ticketId);
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    if (paymentStatus === 'approved') {
      ticket.status = 'PAID';
      ticket.paymentId = data.data.id;
      await ticket.save();
      
      // Enviar email con el ticket
      try {
        await sendTicketEmail({
          ticket: {
            eventName: ticket.eventId.name,
            date: ticket.eventId.date,
            location: ticket.eventId.location,
            seats: ticket.seats,
          },
          qrCode: ticket.qrCode,
          email: ticket.buyerInfo.email,
        });
        console.log('Email enviado:', ticket.buyerInfo.email);
      } catch (emailError) {
        console.error('Error enviando email:', emailError);
      }
      
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