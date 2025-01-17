// app/api/credits/webhook/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Credit, CreditPackage } from '@/app/models/Credit';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import mongoose from 'mongoose';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

const payment = new Payment(client);

type PaymentInfo = {
  id: string | number;
  status: string;
  external_reference: string;
};

export async function POST(req: Request) {
  let session = null;

  try {
    const body: { data: { id: string } } = await req.json();
    console.log('Webhook de créditos recibido:', body);

    if (!body.data?.id) {
      console.log('Webhook ignorado - falta ID de pago');
      return NextResponse.json({ message: 'Webhook ignorado' }, { status: 200 });
    }

    const paymentInfo = await payment.get({ id: body.data.id }) as unknown as PaymentInfo;

    if (!paymentInfo || !paymentInfo.id || !paymentInfo.status || !paymentInfo.external_reference) {
      console.error('Información de pago incompleta:', paymentInfo);
      return NextResponse.json({ error: 'Información de pago incompleta' }, { status: 200 });
    }

    console.log('Información del pago:', {
      paymentId: String(paymentInfo.id),
      status: paymentInfo.status,
      external_reference: paymentInfo.external_reference
    });

    await dbConnect();
    session = await mongoose.startSession();
    session.startTransaction();

    // Extraer información del external_reference
    const [type, userId, packageId] = paymentInfo.external_reference.split('_');

    if (type !== 'credits') {
      await session.abortTransaction();
      return NextResponse.json({ message: 'No es un pago de créditos' }, { status: 200 });
    }

    // Buscar el paquete de créditos y el usuario
    const creditPackage = await CreditPackage.findById(packageId).session(session);
    const userCredits = await Credit.findOne({ userId }).session(session);

    if (!creditPackage || !userCredits) {
      await session.abortTransaction();
      return NextResponse.json({ message: 'Paquete o usuario no encontrado' }, { status: 200 });
    }

    if (type === 'credits') {
      const [_, __, userId, creditsAmount] = paymentInfo.external_reference.split('_');
      const credits = parseInt(creditsAmount);
      
      // Actualizar créditos del usuario
      userCredits.balance += credits;
      userCredits.transactions.push({
        type: 'PURCHASE',
        amount: credits,
        paymentId: String(paymentInfo.id)
      });
    }

    if (paymentInfo.status === "approved") {
      // Actualizar créditos del usuario
      userCredits.balance += creditPackage.credits;
      userCredits.transactions.push({
        type: 'PURCHASE',
        amount: creditPackage.credits,
        packageId,
        paymentId: String(paymentInfo.id)
      });

      await userCredits.save({ session });
      await session.commitTransaction();

      console.log('Créditos acreditados:', {
        userId,
        credits: creditPackage.credits,
        newBalance: userCredits.balance
      });
    } 
    // Manejar otros estados si es necesario
    else if (['rejected', 'cancelled', 'refunded'].includes(paymentInfo.status)) {
      console.log('Pago rechazado o cancelado:', {
        userId,
        packageId,
        status: paymentInfo.status
      });
      await session.commitTransaction();
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook procesado exitosamente',
      data: {
        userId,
        packageId,
        paymentId: String(paymentInfo.id),
        status: paymentInfo.status
      }
    }, { status: 200 });

  } catch (error) {
    if (session) await session.abortTransaction();
    console.error('Error procesando webhook de créditos:', error);
    return NextResponse.json(
      { error: 'Error al procesar el webhook' },
      { status: 200 }
    );
  } finally {
    if (session) await session.endSession();
  }
}