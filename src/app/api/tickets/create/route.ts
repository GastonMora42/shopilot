// app/api/tickets/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Event } from '@/app/models/Event';
import { Ticket } from '@/app/models/Ticket';
import { generateQRCode } from '@/app/lib/utils';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const data = await req.json();
    
    // Verificar disponibilidad
    const event = await Event.findById(data.eventId);
    if (!event || event.availableSeats < 1) {
      return NextResponse.json(
        { error: 'No hay asientos disponibles' },
        { status: 400 }
      );
    }

    // Generar QR único
    const qrCode = await generateQRCode();

    // Crear ticket
    const ticket = await Ticket.create({
      ...data,
      qrCode,
      status: 'PENDING'
    });

    // Actualizar asientos disponibles
    await Event.findByIdAndUpdate(data.eventId, {
      $inc: { availableSeats: -1 }
    });

    // Aquí iría la integración con MercadoPago
    // Por ahora retornamos el ticket creado
    return NextResponse.json(ticket, { status: 201 });

  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Error creating ticket' },
      { status: 500 }
    );
  }
}