// app/api/payments/success/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

const payment = new Payment(client);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('payment_id');
    const status = searchParams.get('collection_status');
    const externalReference = searchParams.get('external_reference');

    console.log('Success callback recibido:', {
      paymentId,
      status,
      externalReference
    });

    // Verificar que tenemos los parámetros necesarios
    if (!paymentId || !status || !externalReference) {
      console.error('Faltan parámetros en callback de success');
      return NextResponse.redirect(
        new URL('/payment/error', req.url)
      );
    }

    // Verificar el estado del pago directamente con MercadoPago
    const paymentInfo = await payment.get({ id: paymentId });
    
    console.log('Estado del pago verificado:', {
      id: paymentInfo.id,
      status: paymentInfo.status
    });

    // Solo verificamos el estado del ticket
    if (status === 'approved' && externalReference) {
      await dbConnect();
      
      const ticket = await Ticket.findById(externalReference);
      
      console.log('Estado del ticket:', {
        id: ticket?._id,
        status: ticket?.status,
        paymentId: ticket?.paymentId
      });

      // No actualizamos nada aquí - solo verificamos
      if (!ticket) {
        console.error('Ticket no encontrado en success callback');
        return NextResponse.redirect(
          new URL('/payment/error', req.url)
        );
      }
    }

    // Si todo está bien, redirigimos a la página de éxito
    const successUrl = new URL(`/payment/success`, req.url);
    successUrl.searchParams.set('ticketId', externalReference);
    
    if (paymentId) {
      successUrl.searchParams.set('paymentId', paymentId);
    }

    console.log('Redirigiendo a:', successUrl.toString());

    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error('Error en success callback:', error);
    return NextResponse.redirect(
      new URL('/payment/error', req.url)
    );
  }
}