// app/api/payments/verify/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN!
});

const payment = new Payment(client);

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

    // Verificar el ticket
    const ticket = await Ticket.findById(ticketId).populate('eventId');
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 }
      );
    }

    console.log('Current ticket status:', ticket.status);

    // Si el ticket ya está pagado, retornar éxito
    if (ticket.status === 'PAID') {
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
          price: ticket.price
        }
      });
    }

    // Verificar el pago en MercadoPago
    try {
      const paymentInfo = await payment.get({ id: paymentId });
      console.log('Payment info from MP:', { 
        status: paymentInfo.status,
        external_reference: paymentInfo.external_reference
      });

      if (paymentInfo.status === 'approved') {
        return NextResponse.json({
          success: true,
          ticket: {
            id: ticket._id,
            status: 'PAID',
            eventName: ticket.eventId.name,
            date: ticket.eventId.date,
            location: ticket.eventId.location,
            seats: ticket.seats,
            qrCode: ticket.qrCode,
            buyerInfo: ticket.buyerInfo,
            price: ticket.price
          }
        });
      }

      return NextResponse.json({
        success: false,
        error: 'El pago aún no está aprobado'
      }, { status: 400 });

    } catch (mpError) {
      console.error('MercadoPago error:', mpError);
      return NextResponse.json({
        success: false,
        error: 'Error al verificar el pago con MercadoPago'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al verificar el pago'
    }, { status: 500 });
  }
}