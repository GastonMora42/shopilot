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

const RESERVATION_TIMEOUT = 15 * 60 * 1000; // 15 minutos en milisegundos

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { eventId, seats, buyerInfo } = await req.json();
    
    console.log('Creating ticket request:', { eventId, seats, buyerInfo });

    if (!isValidObjectId(eventId) || !seats?.length || !buyerInfo) {
      return NextResponse.json(
        { error: 'Datos incompletos o inválidos' },
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

    // Liberar asientos expirados antes de verificar disponibilidad
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
          buyerInfo: {
            ...buyerInfo,
            email: buyerInfo.email.toLowerCase().trim()
          },
          price: total
        }], { session });

        // Marcar asientos como reservados con tiempo de expiración
        const reservationExpires = new Date(Date.now() + RESERVATION_TIMEOUT);
        
        await Seat.updateMany(
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
      description: `${seats.length} entrada(s) para ${event.name}`
    });

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket._id,
        seats: ticket.seats,
        total: ticket.price
      },
      checkoutUrl: preference.init_point,
      preferenceId: preference.id
    });

  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la compra' },
      { status: 500 }
    );
  }
}