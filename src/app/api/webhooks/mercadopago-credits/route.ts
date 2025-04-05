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

    console.log('Obteniendo información del pago desde MercadoPago...');
    const paymentInfo = await payment.get({ id: body.data.id }) as unknown as PaymentInfo;

    console.log('Respuesta de MercadoPago:', paymentInfo);

    if (!paymentInfo || !paymentInfo.id || !paymentInfo.status || !paymentInfo.external_reference) {
      console.error('Información de pago incompleta:', paymentInfo);
      return NextResponse.json({ error: 'Información de pago incompleta' }, { status: 200 });
    }

    console.log('Información del pago procesada:', {
      paymentId: String(paymentInfo.id),
      status: paymentInfo.status,
      external_reference: paymentInfo.external_reference
    });

    await dbConnect();
    console.log('Conexión a la base de datos establecida');

    // Extraer información del external_reference
    const refParts = paymentInfo.external_reference.split('_');
    console.log('Partes de la referencia:', refParts);

    const type = refParts[0];
    if (type !== 'credits') {
      console.log('No es un pago de créditos, tipo:', type);
      return NextResponse.json({ message: 'No es un pago de créditos' }, { status: 200 });
    }

    // Obtener el ID del usuario
    const userId = refParts[1];
    console.log('ID de usuario identificado:', userId);
    
    let credits = 0;
    let packageId = null;

    // Determinar si es una compra de paquete o personalizada
    if (refParts.length === 3) {
      // Formato: credits_userId_packageId
      packageId = refParts[2];
      console.log('Identificado como compra de paquete con ID:', packageId);
      
      // Buscar el paquete sin usar sesión primero para depuración
      const creditPackageCheck = await CreditPackage.findById(packageId);
      if (!creditPackageCheck) {
        console.error('Paquete no encontrado con ID:', packageId);
        return NextResponse.json({ message: 'Paquete no encontrado' }, { status: 200 });
      }
      
      credits = creditPackageCheck.credits;
      console.log('Créditos a asignar desde paquete:', credits);
    } else if (refParts.length === 4 && refParts[2] === 'custom') {
      // Formato: credits_userId_custom_amount
      credits = parseInt(refParts[3]);
      console.log('Identificado como compra personalizada de créditos:', credits);
      
      if (isNaN(credits) || credits <= 0) {
        console.error('Cantidad de créditos inválida:', refParts[3]);
        return NextResponse.json({ message: 'Cantidad de créditos inválida' }, { status: 200 });
      }
    } else {
      console.error('Formato de referencia externa inválido:', paymentInfo.external_reference);
      return NextResponse.json({ message: 'Formato de referencia externa inválido' }, { status: 200 });
    }

    // Verificar si el registro de créditos del usuario ya existe sin usar sesión
    const creditCheckResult = await Credit.findOne({ userId });
    console.log('¿Registro de créditos existente?', creditCheckResult ? 'Sí' : 'No');

    // Verificar si el pago ya fue procesado
    const existingTransactionCheck = await Credit.findOne({
      userId,
      'transactions.paymentId': String(paymentInfo.id)
    });

    if (existingTransactionCheck) {
      console.log('Pago ya procesado anteriormente, paymentId:', String(paymentInfo.id));
      return NextResponse.json({ success: true, message: 'Pago ya procesado' }, { status: 200 });
    }

    console.log('Iniciando procesamiento de pago...');

    // Comenzar transacción
    session = await mongoose.startSession();
    session.startTransaction();
    console.log('Transacción de MongoDB iniciada');

    // Buscar o crear registro de créditos del usuario
    let userCredits = await Credit.findOne({ userId }).session(session);
    if (!userCredits) {
      console.log('Creando nuevo registro de créditos para usuario:', userId);
      // Si no existe, crear un registro de crédito para el usuario
      userCredits = new Credit({
        userId,
        balance: 0,
        transactions: []
      });
      await userCredits.save({ session });
      console.log('Nuevo registro de créditos creado');
    }

    // Verificar si el pago ya fue procesado con sesión
    const existingTransaction = await Credit.findOne({
      userId,
      'transactions.paymentId': String(paymentInfo.id)
    }).session(session);

    if (existingTransaction) {
      console.log('Pago ya procesado (verificación con sesión)');
      await session.commitTransaction();
      console.log('Transacción finalizada');
      return NextResponse.json({ success: true, message: 'Pago ya procesado' }, { status: 200 });
    }

    // Procesar el pago según su estado
    if (paymentInfo.status === "approved") {
      console.log('Procesando pago aprobado, acreditando', credits, 'créditos al usuario', userId);
      
      try {
        // Actualizar créditos del usuario
        const updateResult = await Credit.findOneAndUpdate(
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
        
        console.log('Resultado de actualización:', updateResult ? 'Éxito' : 'Fallo');
        console.log('Nuevo balance:', updateResult?.balance);
        
        await session.commitTransaction();
        console.log('Transacción completada con éxito');

        console.log('Créditos acreditados:', {
          userId,
          credits,
          paymentId: String(paymentInfo.id),
          newBalance: updateResult?.balance
        });
      } catch (updateError) {
        console.error('Error durante la actualización de créditos:', updateError);
        await session.abortTransaction();
        throw updateError;
      }
    } 
    // Manejar otros estados si es necesario
    else if (['rejected', 'cancelled', 'refunded'].includes(paymentInfo.status)) {
      console.log('Pago rechazado o cancelado:', {
        userId,
        packageId,
        status: paymentInfo.status
      });
      await session.commitTransaction();
      console.log('Transacción completada (pago no aprobado)');
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
    if (session) {
      console.error('Error, abortando transacción:', error);
      await session.abortTransaction();
    }
    console.error('Error procesando webhook de créditos:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace disponible');
    return NextResponse.json(
      { error: 'Error al procesar el webhook', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 200 }
    );
  } finally {
    if (session) {
      console.log('Finalizando sesión de MongoDB');
      await session.endSession();
    }
  }
}