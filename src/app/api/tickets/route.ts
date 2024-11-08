// app/api/tickets/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Event } from '@/app/models/Event';
import { Ticket, ITicket } from '@/app/models/Ticket';
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

    // Crear ticket y actualizar asientos
    const session = await (await dbConnect()).startSession();
    
    type TicketDocument = Document & {
      _id: mongoose.Types.ObjectId;
      seats: string[];
      price: number;
    };

    let createdTicket: TicketDocument;

    try {
      const result = await session.withTransaction<TicketDocument>(async () => {
        // Crear ticket
        const [newTicket] = await Ticket.create([{
          eventId,
          seats,
          qrCode,
          status: 'PENDING',
          buyerInfo: {
            ...buyerInfo,
            email: buyerInfo.email.toLowerCase().trim()
          },
          price: total
        }], { session });

        // Actualizar asientos
        await Seat.updateMany(
          {
            eventId,
            seatId: { $in: seats }
          },
          {
            status: 'RESERVED',
            ticketId: newTicket._id
          },
          { session }
        );

        return newTicket;
      });

      if (!result) {
        throw new Error('Error al crear el ticket');
      }

      createdTicket = result;

    } finally {
      await session.endSession();
    }

    // Crear preferencia de MercadoPago
    const preference = await createPreference({
      _id: createdTicket._id.toString(),
      eventName: event.name,
      price: total,
      description: `${seats.length} entrada(s) para ${event.name}`
    });

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
      { 
        error: error instanceof Error ? error.message : 'Error al procesar la compra'
      },
      { status: 500 }
    );
  }
}

// Verificar disponibilidad de asientos
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

    const [tickets, seatsStatus] = await Promise.all([
      Ticket.find({
        eventId,
        seats: { $in: seats },
        status: { $in: ['PAID', 'PENDING'] }
      }).select('seats'),
      Seat.find({
        eventId,
        seatId: { $in: seats }
      }).select('seatId status')
    ]);

    const unavailableSeats = new Set([
      ...tickets.flatMap(t => t.seats),
      ...seatsStatus
        .filter(s => s.status !== 'AVAILABLE')
        .map(s => s.seatId)
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