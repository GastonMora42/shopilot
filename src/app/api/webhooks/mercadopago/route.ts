// app/api/webhooks/mercadopago/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN!
});

const payment = new Payment(client);

type PaymentInfo = {
  id: number | string;
  status: string;
  external_reference: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    console.log('Webhook recibido:', {
      type: body.type,
      data: body.data,
      timestamp: new Date().toISOString()
    });

    // Solo procesar notificaciones de pago
    if (body.type !== 'payment') {
      console.log('Notificación ignorada, tipo incorrecto');
      return NextResponse.json({ message: 'Notificación ignorada' });
    }

    // Comprobación de que la notificación contiene un ID de pago
    if (!body.data?.id) {
      console.error('ID de pago faltante');
      return NextResponse.json({ error: 'ID de pago faltante' }, { status: 400 });
    }

    await dbConnect();

    // Obtener detalles del pago
    const paymentInfo = await payment.get({ id: body.data.id }) as unknown as PaymentInfo;
    
    console.log('Información de pago recibida:', {
      id: paymentInfo.id,
      status: paymentInfo.status,
      external_reference: paymentInfo.external_reference
    });

    const ticketId = paymentInfo.external_reference;
    if (!ticketId) {
      console.error('Referencia de ticket faltante o inválida');
      return NextResponse.json({ error: 'Referencia de ticket faltante' }, { status: 400 });
    }

    const paymentId = String(paymentInfo.id); // Convertir ID a string de manera segura
    
    const session = await (await dbConnect()).startSession();

    try {
      const result = await session.withTransaction(async () => {
        console.log('Iniciando transacción...');
        
        const ticket = await Ticket.findById(ticketId).session(session);
        if (!ticket) {
          throw new Error(`Ticket no encontrado: ${ticketId}`);
        }

        console.log('Ticket encontrado:', ticket);

        // Actualización del ticket a "PAID"
        ticket.status = 'PAID';
        await ticket.save({ session });

        // Actualización de los asientos relacionados
        const seatResult = await Seat.updateMany(
          { eventId: ticket.eventId, number: { $in: ticket.seats } },
          { $set: { status: 'OCCUPIED', ticketId: ticket._id } },
          { session }
        );

        console.log('Asientos actualizados:', seatResult);
        return { ticket, seatResult };
      });
    
      // Si llegamos aquí, la transacción fue exitosa
      console.log('Transacción completada con éxito:', result);
    
    } catch (error) {
      console.error('Error en la transacción:', error);
      return NextResponse.json({ error: 'Error en la transacción' }, { status: 500 });
    } finally {
      await session.endSession();
    }
    
    return NextResponse.json({ message: 'Pago procesado con éxito' }, { status: 200 });

  } catch (error) {
    console.error('Error procesando el webhook:', error);
    return NextResponse.json({
      error: 'Error procesando el webhook',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
