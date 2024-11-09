//api/webhooks/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { sendTicketEmail } from '@/app/lib/email';


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
    // Parsear el cuerpo de la notificación
    const body = await req.json();
    
    console.log('Webhook recibido:', {
      type: body.type,
      data: body.data,
      timestamp: new Date().toISOString(),
    });

    // Solo procesar notificaciones de tipo 'payment'
    if (body.type !== 'payment') {
      console.log('Notificación ignorada, tipo incorrecto');
      return NextResponse.json({ message: 'Notificación ignorada' });
    }

    // Verificar si la notificación tiene un ID de pago
    if (!body.data?.id) {
      console.error('Falta ID de pago en la notificación');
      return NextResponse.json({ error: 'Falta ID de pago' }, { status: 400 });
    }

    // Conectar a la base de datos
    await dbConnect();

    // Obtener los detalles del pago
    const paymentInfo = await payment.get({ id: body.data.id }) as unknown as PaymentInfo;
    
    console.log('Información del pago:', {
      id: paymentInfo.id,
      status: paymentInfo.status,
      external_reference: paymentInfo.external_reference,
    });

    // Obtener el ID del ticket desde la referencia externa
    const ticketId = paymentInfo.external_reference;
    const paymentId = String(paymentInfo.id); // Convertir ID de pago a string de manera segura

    if (!ticketId) {
      console.error('Falta la referencia del ticket');
      return NextResponse.json({ error: 'Falta referencia del ticket' }, { status: 400 });
    }

    // Crear una sesión de base de datos para asegurar una transacción atómica
    const session = await (await dbConnect()).startSession();

    try {
      const result = await session.withTransaction(async () => {
        const ticket = await Ticket.findById(ticketId)
          .populate('eventId') // Importante: populate para tener los datos del evento
          .session(session);
        
        if (!ticket) {
          throw new Error(`Ticket no encontrado: ${ticketId}`);
        }
  
        if (ticket.status === 'PENDING' && paymentInfo.status === 'approved') {
          ticket.status = 'PAID';
          ticket.paymentId = paymentId;
          await ticket.save({ session });
  
          // Actualizar asientos
          const seatResult = await Seat.updateMany(
            {
              eventId: ticket.eventId,
              number: { $in: ticket.seats }
            },
            {
              $set: {
                status: 'OCCUPIED',
                ticketId: ticket._id
              }
            },
            { session }
          );
  
          // Enviar email después de confirmar el pago
          try {
            await sendTicketEmail({
              ticket: {
                eventName: ticket.eventId.name,
                date: ticket.eventId.date,
                location: ticket.eventId.location,
                seats: ticket.seats
              },
              qrCode: ticket.qrCode,
              email: ticket.buyerInfo.email
            });
            console.log('Email enviado a:', ticket.buyerInfo.email);
          } catch (emailError) {
            console.error('Error enviando email:', emailError);
            // No lanzamos el error para no afectar la transacción principal
          }
  
          return { ticket, seatResult };
        } else {
          console.log('No es necesario actualizar:', {
            estadoTicket: ticket.status,
            estadoPago: paymentInfo.status,
          });
        }
      });
      // Resultado de la transacción
      console.log('Resultado de la transacción:', result);

      return NextResponse.json({
        success: true,
        message: 'Webhook procesado exitosamente',
        data: {
          ticketId,
          paymentId,
          status: paymentInfo.status,
        },
      });

    } finally {
      // Cerrar la sesión de base de datos
      await session.endSession();
    }

  } catch (error) {
    // Capturar cualquier error en el procesamiento del webhook
    console.error('Error al procesar el webhook:', error);
    return NextResponse.json(
      {
        error: 'Error al procesar el webhook',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
