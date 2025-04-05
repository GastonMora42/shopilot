// app/api/webhooks/mercadopago-credits/route.ts
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
    const refParts = paymentInfo.external_reference.split('_');
    const type = refParts[0];

    if (type !== 'credits') {
      await session.abortTransaction();
      return NextResponse.json({ message: 'No es un pago de créditos' }, { status: 200 });
    }

    // Obtener el ID del usuario
    const userId = refParts[1];
    let credits = 0;
    let packageId = null;

    // Determinar si es una compra de paquete o personalizada
    if (refParts.length === 3) {
      // Formato: credits_userId_packageId
      packageId = refParts[2];
      const creditPackage = await CreditPackage.findById(packageId).session(session);
      if (!creditPackage) {
        await session.abortTransaction();
        return NextResponse.json({ message: 'Paquete no encontrado' }, { status: 200 });
      }
      credits = creditPackage.credits;
    } else if (refParts.length === 4 && refParts[2] === 'custom') {
      // Formato: credits_userId_custom_amount
      credits = parseInt(refParts[3]);
      if (isNaN(credits) || credits <= 0) {
        await session.abortTransaction();
        return NextResponse.json({ message: 'Cantidad de créditos inválida' }, { status: 200 });
      }
    } else {
      await session.abortTransaction();
      return NextResponse.json({ message: 'Formato de referencia externa inválido' }, { status: 200 });
    }

    // Buscar o crear registro de créditos del usuario
    let userCredits = await Credit.findOne({ userId }).session(session);
    if (!userCredits) {
      // Si no existe, crear un registro de crédito para el usuario
      userCredits = new Credit({
        userId,
        balance: 0,
        transactions: []
      });
      await userCredits.save({ session });
    }

    // Verificar si el pago ya fue procesado
    const existingTransaction = await Credit.findOne({
      userId,
      'transactions.paymentId': String(paymentInfo.id)
    }).session(session);

    if (existingTransaction) {
      console.log('Pago ya procesado anteriormente:', String(paymentInfo.id));
      await session.commitTransaction();
      return NextResponse.json({ success: true, message: 'Pago ya procesado' }, { status: 200 });
    }

    // Procesar el pago según su estado
    if (paymentInfo.status === "approved") {
      // Actualizar créditos del usuario
      await Credit.findOneAndUpdate(
        { userId },
        {
          $inc: { balance: credits },
          $push: {
            transactions: {
              type: 'PURCHASE',
              amount: credits,
              packageId,
              paymentId: String(paymentInfo.id),
              timestamp: new Date()
            }
          }
        },
        { session, new: true }
      );

      await session.commitTransaction();

      console.log('Créditos acreditados:', {
        userId,
        credits,
        paymentId: String(paymentInfo.id)
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
        credits,
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