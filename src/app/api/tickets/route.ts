// app/api/tickets/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Event } from '@/app/models/Event';
import { Ticket } from '@/app/models/Ticket';
import { generateQRCode } from '@/app/lib/utils';
import { createPreference } from '@/app/lib/mercadopago';

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
    
    // Validaciones de entrada
    if (!eventId || !seats?.length || !buyerInfo) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
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

    // Verificar disponibilidad de asientos
    const existingTickets = await Ticket.find({
      eventId,
      seats: { $in: seats },
      status: { $in: ['PAID', 'PENDING'] }
    });

    if (existingTickets.length > 0) {
      return NextResponse.json(
        { error: 'Algunos asientos ya no están disponibles' },
        { status: 400 }
      );
    }

    // Calcular precio total
    const total = seats.reduce((sum: number, seat: string) => {
      const { row } = parseSeatId(seat);
      const rowIndex = row.charCodeAt(0) - 65;
      
      const section = event.seatingChart.sections.find((s: { rowStart: number; rowEnd: number; }) => 
        rowIndex >= s.rowStart && 
        rowIndex <= s.rowEnd
      );

      if (!section) {
        throw new Error(`Sección no encontrada para el asiento ${seat}`);
      }

      return sum + section.price;
    }, 0);

    // Generar QR único
    const qrCode = await generateQRCode();

    // Crear ticket pendiente
    const ticket = await Ticket.create({
      eventId,
      seats,
      qrCode,
      status: 'PENDING',
      buyerInfo: {
        ...buyerInfo,
        email: buyerInfo.email.toLowerCase().trim()
      },
      price: total
    });

    // Crear preferencia de MercadoPago
    const preference = await createPreference({
      _id: ticket._id.toString(),
      eventName: event.name,
      price: total,
      description: `${seats.length} entrada(s) para ${event.name}`
    });

    // Retornar datos para el checkout
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
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Error al procesar la compra';
      
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Opcional: Endpoint para verificar disponibilidad de asientos
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const seats = searchParams.get('seats')?.split(',');

    if (!eventId || !seats?.length) {
      return NextResponse.json(
        { error: 'Parámetros inválidos' },
        { status: 400 }
      );
    }

    const occupiedSeats = await Ticket.find({
      eventId,
      seats: { $in: seats },
      status: { $in: ['PAID', 'PENDING'] }
    }).select('seats');

    return NextResponse.json({
      success: true,
      available: occupiedSeats.length === 0,
      occupiedSeats: occupiedSeats.flatMap(t => t.seats)
    });

  } catch (error) {
    console.error('Error checking seats:', error);
    return NextResponse.json(
      { error: 'Error al verificar asientos' },
      { status: 500 }
    );
  }
}