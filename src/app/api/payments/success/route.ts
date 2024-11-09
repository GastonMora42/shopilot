// app/api/payments/success/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('payment_id');
    const status = searchParams.get('collection_status');
    const externalReference = searchParams.get('external_reference');
    const preferenceId = searchParams.get('preference_id');

    console.log('Success callback received:', {
      paymentId,
      status,
      externalReference,
      preferenceId
    });

    if (!externalReference) {
      console.error('Missing external_reference');
      return NextResponse.redirect(
        new URL('/payment/error', process.env.NEXT_PUBLIC_BASE_URL!)
      );
    }

    await dbConnect();

    // Verificar que el ticket existe
    const ticket = await Ticket.findById(externalReference);
    if (!ticket) {
      console.error('Ticket not found:', externalReference);
      return NextResponse.redirect(
        new URL('/payment/error', process.env.NEXT_PUBLIC_BASE_URL!)
      );
    }

    // Construir URL con los parámetros necesarios
    const successUrl = new URL('/payment/success', process.env.NEXT_PUBLIC_BASE_URL);
    
    // Añadir todos los parámetros relevantes
    Object.entries({
      ticketId: externalReference,
      payment_id: paymentId,
      collection_status: status,
      preference_id: preferenceId
    }).forEach(([key, value]) => {
      if (value) {
        successUrl.searchParams.set(key, value);
      }
    });

    console.log('Redirecting to:', successUrl.toString());

    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error('Success route error:', error);
    return NextResponse.redirect(
      new URL('/payment/error', process.env.NEXT_PUBLIC_BASE_URL!)
    );
  }
}