// app/api/tickets/create/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Event } from '@/app/models/Event';
import { Ticket } from '@/app/models/Ticket';
import { generateQRCode } from '@/app/lib/utils';
import { createPreference } from '@/app/lib/mercadopago';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    await dbConnect();
    
    const { eventId, seats, buyerInfo } = await req.json();

    // Validaciones básicas
    if (!eventId || !seats?.length || !buyerInfo) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    // Verificar evento y disponibilidad
    const event = await Event.findById(eventId);
    if (!event || !event.published) {
      return NextResponse.json(
        { error: 'Evento no encontrado o no publicado' },
        { status: 404 }
      );
    }

    // Verificar que los asientos estén disponibles
    const existingTickets = await Ticket.find({
      eventId,
      'seats': { $in: seats },
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
      const [sectionName] = seat.split('-');
      const section = event.seatingChart.sections.find((s: { name: string; }) => s.name === sectionName);
      return sum + (section?.price || 0);
    }, 0);

    // Generar QR único
    const qrCode = await generateQRCode();

    // Crear ticket
    const ticket = await Ticket.create({
      eventId,
      seats,
      qrCode,
      status: 'PENDING',
      price: total,
      buyerInfo: {
        ...buyerInfo,
        email: session?.user?.email || buyerInfo.email
      }
    });

    // Crear preferencia de MP
    const preference = await createPreference({
      _id: ticket._id.toString(),
      eventName: event.name,
      price: total,
    });

    // Actualizar ticket con ID de preferencia
    ticket.paymentId = preference.id;
    await ticket.save();

    return NextResponse.json({
      success: true,
      ticket,
      preferenceId: preference.id,
      checkoutUrl: preference.init_point
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Error al procesar la compra' },
      { status: 500 }
    );
  }
}