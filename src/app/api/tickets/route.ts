// app/api/tickets/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Event } from '@/app/models/Event';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import { generateQRCode } from '@/app/lib/utils';
import { createPreference } from '@/app/lib/mercadopago';
import mongoose, { isValidObjectId } from 'mongoose';

interface SeatInfo {
  row: string;
  number: number;
}

function parseSeatId(seatId: string): SeatInfo {
  const row = seatId.charAt(0);
  const number = parseInt(seatId.slice(1));
  return { row, number };
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { eventId, seats, buyerInfo } = await req.json();
    
    console.log('Creating ticket:', { eventId, seats, buyerInfo });

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

    // Verificar que los asientos estén disponibles
    const occupiedSeats = await Seat.find({
      eventId,
      number: { $in: seats },
      status: { $in: ['OCCUPIED', 'RESERVED'] }
    });

    if (occupiedSeats.length > 0) {
      return NextResponse.json({
        error: 'Algunos asientos no están disponibles',
        unavailableSeats: occupiedSeats.map(seat => seat.number)
      }, { status: 409 });
    }

    // Calcular precio total
    const total = seats.reduce((sum: number, seat: string) => {
      const { row } = parseSeatId(seat);
      const rowIndex = row.charCodeAt(0) - 65;
      
      const section = event.seatingChart.sections.find((s: { rowStart: number; rowEnd: number; }) => 
        rowIndex >= s.rowStart && rowIndex <= s.rowEnd
      );

      if (!section) {
        throw new Error(`Sección no encontrada para el asiento ${seat}`);
      }

      return sum + section.price;
    }, 0);

    // Generar QR único
    const qrCode = await generateQRCode();

    // Crear ticket y actualizar asientos en una transacción
    const session = await (await dbConnect()).startSession();
    let createdTicket: any = null;

    try {
      await session.withTransaction(async () => {
        // Crear ticket con status PENDING
        const [ticket] = await Ticket.create([{
          eventId,
          seats,
          qrCode,
          status: 'PENDING', // Importante: Iniciar como PENDING
          buyerInfo: {
            ...buyerInfo,
            email: buyerInfo.email.toLowerCase().trim()
          },
          price: total
        }], { session });

        createdTicket = ticket;

        // Marcar asientos como RESERVED
        const seatUpdateResult = await Seat.updateMany(
          {
            eventId,
            number: { $in: seats },
            status: 'AVAILABLE' // Solo actualizar si están disponibles
          },
          {
            $set: {
              status: 'RESERVED',
              ticketId: ticket._id
            }
          },
          { session }
        );

        console.log('Seats update result:', seatUpdateResult);

        // Verificar que se actualizaron todos los asientos
        if (seatUpdateResult.modifiedCount !== seats.length) {
          throw new Error('No se pudieron reservar todos los asientos');
        }
      });
    } finally {
      await session.endSession();
    }

    if (!createdTicket) {
      throw new Error('Error al crear el ticket');
    }

    // Crear preferencia de MercadoPago
    const preference = await createPreference({
      _id: createdTicket._id.toString(),
      eventName: event.name,
      price: total,
      description: `${seats.length} entrada(s) para ${event.name}`,
    });

    console.log('Created preference:', preference);

    return NextResponse.json({
      success: true,
      ticket: {
        id: createdTicket._id,
        seats: createdTicket.seats,
        total: createdTicket.price
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const seats = searchParams.get('seats')?.split(',');

    if (!isValidObjectId(eventId) || !seats?.length) {
      return NextResponse.json(
        { error: 'Parámetros inválidos' },
        { status: 400 }
      );
    }

    // Verificar asientos ocupados y tickets existentes
    const [tickets, seatsStatus] = await Promise.all([
      Ticket.find({
        eventId,
        seats: { $in: seats },
        status: { $in: ['PAID', 'PENDING'] }
      }).select('seats status'),
      Seat.find({
        eventId,
        number: { $in: seats }
      }).select('number status')
    ]);

    console.log('Found seats status:', seatsStatus);
    console.log('Found tickets:', tickets);

    const unavailableSeats = new Set([
      ...tickets.flatMap(t => t.seats),
      ...seatsStatus
        .filter(s => s.status !== 'AVAILABLE')
        .map(s => s.number)
    ]);

    return NextResponse.json({
      success: true,
      available: unavailableSeats.size === 0,
      occupiedSeats: Array.from(unavailableSeats)
    });

  } catch (error) {
    console.error('Error checking seats:', error);
    return NextResponse.json(
      { error: 'Error al verificar asientos' },
      { status: 500 }
    );
  }
}