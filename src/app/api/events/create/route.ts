import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Event } from '@/app/models/Event';
import { Seat } from '@/app/models/Seat';
import { User } from '@/app/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import mongoose from 'mongoose'

// Definir tipos para la estructura de seatingChart
interface Section {
  name: string;
  rowStart: number;
  rowEnd: number;
  columnStart: number;
  columnEnd: number;
  price: number;
  type: 'REGULAR' | 'VIP' | 'DISABLED';
}

interface SeatingChart {
  rows: number;
  columns: number;
  sections: Section[];
}

async function generateSeatsForEvent(eventId: string, seatingChart: SeatingChart) {
  const seats = [];
  
  // Validar límites
  if (seatingChart.rows > 26) {
    throw new Error('Número de filas excede el límite (máximo 26)');
  }

  for (let rowIndex = 1; rowIndex <= seatingChart.rows; rowIndex++) {
    for (let colIndex = 1; colIndex <= seatingChart.columns; colIndex++) {
      const section = seatingChart.sections.find(s => 
        rowIndex >= s.rowStart && 
        rowIndex <= s.rowEnd && 
        colIndex >= s.columnStart && 
        colIndex <= s.columnEnd
      );

      if (section) {
        const seatId = `${rowIndex}-${colIndex}`;

        seats.push({
          eventId,
          seatId,
          row: rowIndex,
          column: colIndex,
          status: 'AVAILABLE',
          type: section.type,
          price: section.price,
          section: section.name,
          temporaryReservation: null,
          lastReservationAttempt: null
        });
      }
    }
  }
  
  console.log('Generated seats:', {
    total: seats.length,
    firstSeat: seats[0],
    lastSeat: seats[seats.length - 1]
  });
  
  return seats;
}

// app/api/events/create/route.ts

function validateSeatingChart(seatingChart: SeatingChart): string | null {
  if (!seatingChart.rows || seatingChart.rows < 1) {
    return 'Número de filas inválido';
  }

  if (!seatingChart.columns || seatingChart.columns < 1) {
    return 'Número de columnas inválido';
  }

  if (!Array.isArray(seatingChart.sections) || seatingChart.sections.length === 0) {
    return 'Debe definir al menos una sección';
  }

  // Los índices ahora empiezan en 1
  for (const section of seatingChart.sections) {
    // Ajustar la validación para el nuevo formato de índices
    if (section.rowStart < 1 || section.rowEnd > seatingChart.rows) {
      return `Límites de fila inválidos en sección ${section.name}. Debe estar entre 1 y ${seatingChart.rows}`;
    }
    if (section.columnStart < 1 || section.columnEnd > seatingChart.columns) {
      return `Límites de columna inválidos en sección ${section.name}. Debe estar entre 1 y ${seatingChart.columns}`;
    }
    if (section.price < 0) {
      return 'Precio inválido en sección';
    }
    if (!['REGULAR', 'VIP', 'DISABLED'].includes(section.type)) {
      return 'Tipo de sección inválido';
    }
  }

  // Verificar que las secciones no se superpongan
  for (let i = 0; i < seatingChart.sections.length; i++) {
    for (let j = i + 1; j < seatingChart.sections.length; j++) {
      const secA = seatingChart.sections[i];
      const secB = seatingChart.sections[j];
      
      if (!(secA.rowEnd < secB.rowStart || secA.rowStart > secB.rowEnd ||
            secA.columnEnd < secB.columnStart || secA.columnStart > secB.columnEnd)) {
        return `Las secciones ${secA.name} y ${secB.name} se superponen`;
      }
    }
  }

  return null;
}


export async function POST(req: Request) {
  let mongoSession = null;

  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await dbConnect();
    
    // Obtener usuario y sus credenciales de MP
    const user = await User.findOne({ email: authSession.user.email });
    if (!user?.mercadopago?.accessToken) {
      return NextResponse.json(
        { error: 'MercadoPago no está configurado' },
        { status: 400 }
      );
    }

    const data = await req.json();

    // Validar seatingChart
    const validationError = validateSeatingChart(data.seatingChart);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    // Iniciar sesión de MongoDB
    mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();

    try {
      // Crear el evento
      const [event] = await Event.create([{
        ...data,
        organizerId: user._id,
        mercadopago: {
          accessToken: user.mercadopago.accessToken,
          userId: user.mercadopago.userId
        },
        published: false
      }], { session: mongoSession });

      // Generar y crear los asientos
      const seats = await generateSeatsForEvent(
        event._id.toString(), 
        data.seatingChart
      );
      
      await Seat.insertMany(seats, { session: mongoSession });

      await mongoSession.commitTransaction();

      return NextResponse.json({
        success: true,
        event: event.toJSON(),
        totalSeats: seats.length
      }, { status: 201 });

    } catch (error) {
      if (mongoSession) {
        await mongoSession.abortTransaction();
      }
      throw error;
    }

  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error al crear el evento'
    }, { status: 500 });
  } finally {
    if (mongoSession) {
      await mongoSession.endSession();
    }
  }
}