// app/api/tickets/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Event } from '@/app/models/Event';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import { generateQRCode } from '@/app/lib/utils';
import { createPreference } from '@/app/lib/mercadopago';
import { isValidObjectId } from 'mongoose';
import type { ITicket } from '@/types';

const RESERVATION_TIMEOUT = 5 * 60 * 1000; // 5 minutos en milisegundos

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { eventId, seats, buyerInfo } = await req.json();
    
    console.log('1. Solicitud de creación de ticket:', { 
      eventId, 
      seats, 
      buyerInfo: { ...buyerInfo, email: buyerInfo?.email?.toLowerCase() } 
    });

    // Validación de datos de entrada
    if (!isValidObjectId(eventId) || !seats?.length || !buyerInfo || !buyerInfo.email) {
      return NextResponse.json(
        { error: 'Datos incompletos o inválidos' },
        { status: 400 }
      );
    }

    // Validar email
    buyerInfo.email = buyerInfo.email.toLowerCase().trim();
    if (!/\S+@\S+\.\S+/.test(buyerInfo.email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Verificar evento
    const event = await Event.findById(eventId);
    if (!event || !event.published) {
      return NextResponse.json(
        { error: 'Evento no encontrado o no publicado' },
        { status: 404 }
      );
    }

    // Liberar asientos expirados
    await Seat.releaseExpiredSeats(eventId);

    // Calcular precio total
    const total = seats.reduce((sum: number, seat: string) => {
      const row = seat.charAt(0);
      const rowIndex = row.charCodeAt(0) - 65;
      
      const section = event.seatingChart.sections.find((s: { rowStart: number; rowEnd: number; }) => 
        rowIndex >= s.rowStart && rowIndex <= s.rowEnd
      );

      if (!section) {
        throw new Error(`Sección no encontrada para el asiento ${seat}`);
      }

      return sum + section.price;
    }, 0);

    console.log('2. Precio total calculado:', total);

    // Iniciar transacción
    const session = await (await dbConnect()).startSession();
    let ticket: ITicket | null = null;

    try {
      const result = await session.withTransaction(async () => {
        // Verificar disponibilidad de asientos
        const occupiedSeats = await Seat.find({
          eventId,
          number: { $in: seats },
          status: { $ne: 'AVAILABLE' }
        }).session(session);

        if (occupiedSeats.length > 0) {
          throw new Error('Algunos asientos ya no están disponibles');
        }

        // Crear ticket
        const [newTicket] = await Ticket.create([{
          eventId,
          seats,
          qrCode: await generateQRCode(),
          status: 'PENDING',
          buyerInfo,
          price: total
        }], { session });

        console.log('3. Ticket creado:', {
          id: newTicket._id,
          status: newTicket.status
        });

        // Reservar asientos
        const reservationExpires = new Date(Date.now() + RESERVATION_TIMEOUT);
        
        const seatResult = await Seat.updateMany(
          {
            eventId,
            number: { $in: seats }
          },
          {
            $set: {
              status: 'RESERVED',
              ticketId: newTicket._id,
              reservationExpires
            }
          },
          { session }
        );

        console.log('4. Asientos reservados:', {
          count: seatResult.modifiedCount,
          seats: seats
        });

        return newTicket;
      });

      ticket = result;
    } finally {
      await session.endSession();
    }

    if (!ticket) {
      throw new Error('Error al crear el ticket');
    }

    // Crear preferencia de MercadoPago
    const preference = await createPreference({
      _id: ticket._id.toString(),
      eventName: event.name,
      price: total,
      description: `${seats.length} entrada(s) para ${event.name} - Asientos: ${seats.join(', ')}`
    });

    console.log('5. Preferencia de MercadoPago creada:', {
      preferenceId: preference.id,
      ticketId: ticket._id
    });

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket._id,
        status: ticket.status,
        seats: ticket.seats,
        total: ticket.price
      },
      checkoutUrl: preference.init_point,
      preferenceId: preference.id
    });

  } catch (error) {
    console.error('Error al crear el ticket:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la compra' },
      { status: 500 }
    );
  }
}