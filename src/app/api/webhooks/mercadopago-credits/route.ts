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
  try {
    const body: { data: { id: string } } = await req.json();
    console.log('Webhook de créditos recibido:', body);

    if (!body.data?.id) {
      console.log('Webhook ignorado - falta ID de pago');
      return NextResponse.json({ message: 'Webhook ignorado' }, { status: 200 });
    }

    console.log('Obteniendo info del pago desde MercadoPago con ID:', body.data.id);
    const paymentInfo = await payment.get({ id: body.data.id }) as unknown as PaymentInfo;
    console.log('Información de pago obtenida:', {
      paymentId: String(paymentInfo.id),
      status: paymentInfo.status,
      external_reference: paymentInfo.external_reference
    });

    if (!paymentInfo || !paymentInfo.id || !paymentInfo.status || !paymentInfo.external_reference) {
      console.error('Información de pago incompleta');
      return NextResponse.json({ error: 'Información de pago incompleta' }, { status: 200 });
    }

    await dbConnect();
    console.log('Conexión a DB establecida');

    // Extraer información del external_reference
    const refParts = paymentInfo.external_reference.split('_');
    console.log('Partes de referencia:', refParts);

    const type = refParts[0];
    if (type !== 'credits') {
      console.log('No es un pago de créditos');
      return NextResponse.json({ message: 'No es un pago de créditos' }, { status: 200 });
    }

    // CAMBIO IMPORTANTE: Convertir el userId de string a ObjectId
    const userIdString = refParts[1];
    console.log('ID de usuario (string):', userIdString);
    
    // Verificar si el userId es un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(userIdString)) {
      console.error('ID de usuario no es un ObjectId válido:', userIdString);
      return NextResponse.json({ message: 'ID de usuario inválido' }, { status: 200 });
    }
    
    // Convertir a ObjectId
    const userId = new mongoose.Types.ObjectId(userIdString);
    console.log('ID de usuario (ObjectId):', userId);
    
    let credits = 0;
    let packageId = null;

    // Determinar tipo de compra
    if (refParts.length === 3) {
      // Formato: credits_userId_packageId
      packageId = refParts[2];
      console.log('Paquete ID:', packageId);
      
      if (!mongoose.Types.ObjectId.isValid(packageId)) {
        console.error('ID de paquete no es válido:', packageId);
        return NextResponse.json({ message: 'ID de paquete inválido' }, { status: 200 });
      }
      
      const creditPackage = await CreditPackage.findById(packageId);
      console.log('Paquete encontrado:', creditPackage);
      
      if (!creditPackage) {
        console.error('Paquete no encontrado');
        return NextResponse.json({ message: 'Paquete no encontrado' }, { status: 200 });
      }
      
      credits = creditPackage.credits;
    } else if (refParts.length === 4 && refParts[2] === 'custom') {
      credits = parseInt(refParts[3]);
      console.log('Créditos personalizados:', credits);
      
      if (isNaN(credits) || credits <= 0) {
        console.error('Cantidad de créditos inválida');
        return NextResponse.json({ message: 'Cantidad de créditos inválida' }, { status: 200 });
      }
    } else {
      console.error('Formato de referencia externa inválido');
      return NextResponse.json({ message: 'Formato de referencia externa inválido' }, { status: 200 });
    }

    // Verificar si el pago ya fue procesado
    console.log('Verificando si el pago ya fue procesado para userID:', userId);
    const existingTransaction = await Credit.findOne({
      userId,
      'transactions.paymentId': String(paymentInfo.id)
    });

    console.log('¿Transacción existente?', existingTransaction ? 'SÍ' : 'NO');

    if (existingTransaction) {
      console.log('Pago ya procesado anteriormente');
      return NextResponse.json({ success: true, message: 'Pago ya procesado' }, { status: 200 });
    }

    // Procesar pago aprobado
    if (paymentInfo.status === "approved") {
      console.log('Procesando pago aprobado para usuario (ObjectId):', userId);
      console.log('Créditos a agregar:', credits);
      
      // Buscar registro de créditos existente
      let userCredits = await Credit.findOne({ userId });
      console.log('Créditos existentes encontrados:', userCredits ? 'SÍ' : 'NO');
      
      if (!userCredits) {
        console.log('Creando nuevo registro de créditos');
        userCredits = new Credit({
          userId,
          balance: 0,
          transactions: []
        });
        await userCredits.save();
        console.log('Nuevo registro creado con ID:', userCredits._id);
      }

      // Actualizar créditos
      console.log('Actualizando créditos...');
      console.log('Balance actual:', userCredits.balance);
      console.log('A agregar:', credits);
      
      const updatedCredit = await Credit.findOneAndUpdate(
        { userId },
        {
          $inc: { balance: credits },
          $push: {
            transactions: {
              type: 'PURCHASE',
              amount: credits,
              packageId: packageId ? new mongoose.Types.ObjectId(packageId) : undefined,
              paymentId: String(paymentInfo.id),
              timestamp: new Date()
            }
          }
        },
        { new: true }
      );
      
      console.log('Actualización completada. Nuevo balance:', updatedCredit?.balance);
      console.log('Nuevas transacciones:', updatedCredit?.transactions.length);
    } 
    else if (['rejected', 'cancelled', 'refunded'].includes(paymentInfo.status)) {
      console.log('Pago no aprobado:', paymentInfo.status);
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook procesado exitosamente',
      data: {
        userId: userIdString,
        credits,
        paymentId: String(paymentInfo.id),
        status: paymentInfo.status
      }
    }, { status: 200 });

  } catch (error) {
    console.error('ERROR PROCESANDO WEBHOOK:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Error al procesar el webhook', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 200 }
    );
  }
}