// api/tickets/create/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Event } from '@/app/models/Event';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import { User } from '@/app/models/User';
import { createPreference } from '@/app/lib/mercadopago';
import { isValidObjectId } from 'mongoose';
import mongoose from 'mongoose';
import { authOptions } from '@/app/lib/auth';
import { getServerSession } from 'next-auth/next';
import { generateTicketQRs } from '@/app/lib/qrGenerator';

export async function POST(req: Request) {
  let session = null;
  
  try {
    // Verificar autenticación
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user) {
      return NextResponse.json(
        { error: 'Debe iniciar sesión para comprar tickets' },
        { status: 401 }
      );
    }

    await dbConnect();
    const { eventId, eventType, seats, ticketType, quantity, buyerInfo, sessionId } = await req.json();
    
    console.log('Creating ticket request:', { 
      eventId, eventType, seats, ticketType, quantity, buyerInfo, sessionId 
    });

    if (!isValidObjectId(eventId) || !buyerInfo) {
      return NextResponse.json(
        { error: 'Datos incompletos o inválidos' },
        { status: 400 }
      );
    }

    // Validación por tipo de evento
    if (eventType === 'SEATED' && (!seats?.length)) {
      return NextResponse.json(
        { error: 'Asientos requeridos para evento con asientos' },
        { status: 400 }
      );
    }
    
    if (eventType === 'GENERAL') {
      if (!ticketType?.name || !ticketType?.price || !quantity) {
        return NextResponse.json(
          { error: 'Datos de ticket general incompletos' },
          { status: 400 }
        );
      }
    }
    
    const event = await Event.findById(eventId);
    if (!event || !event.published) {
      return NextResponse.json(
        { error: 'Evento no encontrado o no publicado' },
        { status: 404 }
      );
    }

    // Validaciones para eventos generales
    if (eventType === 'GENERAL') {
      const validTicket = event.generalTickets.find((t: { name: any; price: any; }) => 
        t.name === ticketType.name && t.price === ticketType.price
      );

      if (!validTicket) {
        return NextResponse.json(
          { error: 'Tipo de ticket inválido' },
          { status: 400 }
        );
      }

      if (validTicket.quantity < quantity) {
        return NextResponse.json(
          { error: 'No hay suficientes tickets disponibles' },
          { status: 400 }
        );
      }

      if (event.maxTicketsPerPurchase && quantity > event.maxTicketsPerPurchase) {
        return NextResponse.json(
          { error: `No puede comprar más de ${event.maxTicketsPerPurchase} tickets por transacción` },
          { status: 400 }
        );
      }
    }

    const organizer = await User.findById(event.organizerId);
    if (!organizer?.mercadopago?.accessToken) {
      return NextResponse.json(
        { error: 'El organizador no tiene una cuenta de MercadoPago conectada' },
        { status: 400 }
      );
    }

    session = await mongoose.startSession();
    await session.startTransaction();

    let total = 0;

    // Cálculo de precios
    if (eventType === 'SEATED') {
      total = seats.reduce((sum: number, seatId: string) => {
        const [sectionName] = seatId.split('-');
        const section = event.seatingChart.sections.find(
          (s: { name: string; price: number }) => s.name === sectionName
        );
        return sum + (section?.price || 0);
      }, 0);
    } else {
      total = ticketType.price * quantity;
    }

    // Generar QRs individuales
    const ticketId = new mongoose.Types.ObjectId().toString();
    const qrTickets = await generateTicketQRs({
      ticketId,
      eventType,
      seats,
      ticketType,
      quantity
    });

    // Verificar disponibilidad y reservar recursos
    if (eventType === 'SEATED') {
      const seatsStatus = await Seat.find({
        eventId,
        seatId: { $in: seats },
        $or: [
          { status: 'AVAILABLE' },
          {
            status: 'RESERVED',
            'temporaryReservation.sessionId': sessionId,
            'temporaryReservation.expiresAt': { $gt: new Date() }
          }
        ]
      }).session(session);

      if (seatsStatus.length !== seats.length) {
        throw new Error('Algunos asientos ya no están disponibles');
      }

      // Actualizar estado de asientos a reservado
      await Seat.updateMany(
        {
          eventId,
          seatId: { $in: seats },
          $or: [
            { status: 'AVAILABLE' },
            {
              status: 'RESERVED',
              'temporaryReservation.sessionId': sessionId
            }
          ]
        },
        {
          $set: {
            status: 'RESERVED',
            temporaryReservation: {
              sessionId,
              expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutos
            }
          }
        },
        { session }
      );
    }

    // Crear ticket con QRs individuales
    const [newTicket] = await Ticket.create([{
      _id: ticketId,
      eventId,
      userId: authSession.user.id,
      eventType,
      ...(eventType === 'SEATED' 
        ? { seats } 
        : { ticketType, quantity }
      ),
      status: 'PENDING',
      buyerInfo: {
        ...buyerInfo,
        email: buyerInfo.email.toLowerCase().trim()
      },
      price: total,
      qrTickets,
      organizerId: event.organizerId
    }], { session });

    // Crear preferencia de pago
    const preference = await createPreference({
      _id: newTicket._id.toString(),
      eventName: event.name,
      price: total,
      description: eventType === 'SEATED' 
        ? `${seats.length} entrada(s) para ${event.name}`
        : `${quantity} entrada(s) para ${event.name}`,
      organizerAccessToken: organizer.mercadopago.accessToken
    });

    await newTicket.updateOne(
      { paymentId: preference.id },
      { session }
    );

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      ticket: {
        id: newTicket._id,
        eventType,
        seats: newTicket.seats,
        ticketType: newTicket.ticketType,
        quantity: newTicket.quantity,
        total: newTicket.price,
        qrTickets: newTicket.qrTickets.map((qr: { qrMetadata: { subTicketId: any; type: any; seatInfo: { seat: any; }; generalInfo: { ticketType: any; index: any; }; status: any; }; }) => ({
          subTicketId: qr.qrMetadata.subTicketId,
          type: qr.qrMetadata.type,
          ...(eventType === 'SEATED' 
            ? { seat: qr.qrMetadata.seatInfo?.seat }
            : { 
                ticketType: qr.qrMetadata.generalInfo?.ticketType,
                index: qr.qrMetadata.generalInfo?.index 
              }
          ),
          status: qr.qrMetadata.status
        }))
      },
      checkoutUrl: preference.init_point,
      preferenceId: preference.id
    });

  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la compra' },
      { status: 500 }
    );
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}