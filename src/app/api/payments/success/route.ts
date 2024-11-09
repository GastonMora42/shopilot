// app/api/payments/success/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN!
});

const payment = new Payment(client);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('payment_id');
    const status = searchParams.get('collection_status');
    const ticketId = searchParams.get('external_reference');

    console.log('Payment success callback:', {
      paymentId,
      status,
      ticketId,
      timestamp: new Date().toISOString()
    });

    if (!paymentId || !ticketId) {
      console.error('Missing required parameters');
      return NextResponse.redirect(
        new URL('/payment/error', req.url)
      );
    }

    await dbConnect();

    // Verificar el estado del ticket
    const ticket = await Ticket.findById(ticketId);
    console.log('Ticket status:', ticket?.status);

    // Construir URL de éxito con todos los parámetros necesarios
    const successUrl = new URL('/payment/success', req.url);
    successUrl.searchParams.set('ticketId', ticketId);
    successUrl.searchParams.set('payment_id', paymentId);
    successUrl.searchParams.set('collection_status', status || '');

    console.log('Redirecting to:', successUrl.toString());

    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error('Success route error:', error);
    return NextResponse.redirect(
      new URL('/payment/error', req.url)
    );
  }
}