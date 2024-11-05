// src/app/api/events/create/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Event } from '@/app/models/Event';
import { Seat } from '@/app/models/Seat';
import { User } from '@/app/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';

async function generateSeatsForEvent(eventId: string, seatingChart: any) {
  const seats = [];
  
  for (let row = 0; row < seatingChart.rows; row++) {
    for (let col = 0; col < seatingChart.columns; col++) {
      const section = seatingChart.sections.find(
        (        s: { rowStart: number; rowEnd: number; columnStart: number; columnEnd: number; }) => 
          row >= s.rowStart && 
          row <= s.rowEnd && 
          col >= s.columnStart && 
          col <= s.columnEnd
      );

      if (section) {
        seats.push({
          eventId,
          row,
          column: col,
          number: `${String.fromCharCode(65 + row)}${col + 1}`,
          status: 'AVAILABLE',
          price: section.price,
          type: section.type
        });
      }
    }
  }
  
  return seats;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Obtener usuario y sus credenciales de MP
    const user = await User.findOne({ email: session.user.email });
    if (!user.mercadopago?.accessToken) {
      return NextResponse.json(
        { error: 'MercadoPago no está configurado' },
        { status: 400 }
      );
    }

    const data = await req.json();

    // Validamos la data del seatingChart
    if (!data.seatingChart?.rows || !data.seatingChart?.columns || !data.seatingChart?.sections) {
      return NextResponse.json(
        { error: 'Configuración de asientos inválida' },
        { status: 400 }
      );
    }

    // Crear el evento
    const event = await Event.create({
      ...data,
      organizerId: user._id,
      mercadopago: {
        accessToken: user.mercadopago.accessToken,
        userId: user.mercadopago.userId
      },
      published: false // Por defecto como borrador
    });

    // Generar y crear los asientos
    const seats = await generateSeatsForEvent(event._id.toString(), data.seatingChart);
    await Seat.insertMany(seats);

    return NextResponse.json({
      ...event.toJSON(),
      totalSeatsCreated: seats.length
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Error creating event' },
      { status: 500 }
    );
  }
}