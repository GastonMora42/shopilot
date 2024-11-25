// types.ts
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
  customLayout?: boolean;
}

interface GeneralTicketType {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
}

// app/api/events/create/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Event } from '@/app/models/Event';
import { Seat } from '@/app/models/Seat';
import { User } from '@/app/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import mongoose from 'mongoose';

function validateGeneralEvent(ticketTypes: GeneralTicketType[]): string | null {
  if (!Array.isArray(ticketTypes) || ticketTypes.length === 0) {
    return 'Debe definir al menos un tipo de entrada';
  }

  for (const ticket of ticketTypes) {
    if (!ticket.name || ticket.name.trim() === '') {
      return 'El nombre del tipo de entrada es requerido';
    }
    if (ticket.price < 0) {
      return 'El precio no puede ser negativo';
    }
    if (ticket.quantity < 1) {
      return 'La cantidad debe ser mayor a 0';
    }
  }

  return null;
}

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

  for (const section of seatingChart.sections) {
    if (section.rowStart < 1 || section.rowEnd > seatingChart.rows) {
      return `Límites de fila inválidos en sección ${section.name}`;
    }
    if (section.columnStart < 1 || section.columnEnd > seatingChart.columns) {
      return `Límites de columna inválidos en sección ${section.name}`;
    }
    if (section.price < 0) {
      return 'Precio inválido en sección';
    }
    if (!['REGULAR', 'VIP', 'DISABLED'].includes(section.type)) {
      return 'Tipo de sección inválido';
    }
  }

  if (!seatingChart.customLayout) {
    // Verificar superposición solo para layouts no personalizados
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
    
    const user = await User.findOne({ email: authSession.user.email });
    if (!user?.mercadopago?.accessToken) {
      return NextResponse.json(
        { error: 'MercadoPago no está configurado' },
        { status: 400 }
      );
    }

    const data = await req.json();
    console.log('Received event data:', data);

    // Validar según el tipo de evento
    if (data.eventType === 'SEATED') {
      const validationError = validateSeatingChart(data.seatingChart);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
    } else if (data.eventType === 'GENERAL') {
      const validationError = validateGeneralEvent(data.generalTickets);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
    } else {
      return NextResponse.json(
        { error: 'Tipo de evento inválido' },
        { status: 400 }
      );
    }

    mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();

    try {
      const [event] = await Event.create([{
        ...data,
        imageUrl: data.imageUrl || '',
        organizerId: user._id,
        mercadopago: {
          accessToken: user.mercadopago.accessToken,
          userId: user.mercadopago.userId
        },
        published: false
      }], { session: mongoSession });

      // Generar asientos solo si es un evento con asientos
      let seats = [];
      if (data.eventType === 'SEATED') {
        seats = await generateSeatsForEvent(
          event._id.toString(),
          data.seatingChart
        );
        await Seat.insertMany(seats, { session: mongoSession });
      }

      await mongoSession.commitTransaction();

      const eventJSON = event.toJSON();
      return NextResponse.json({
        success: true,
        event: eventJSON,
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

function generateSeatsForEvent(arg0: any, seatingChart: any): any[] | PromiseLike<any[]> {
  throw new Error('Function not implemented.');
}
