// app/api/events/create/route.ts

import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Event } from '@/app/models/Event';
import { Seat } from '@/app/models/Seat';
import { User } from '@/app/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import mongoose from 'mongoose';
import { 
  EventType, 
  GeneralTicket, 
  SeatingChart, 
  Section,
  Seat as SeatType
} from '@/types/event';

// app/api/events/create/route.ts

function validateGeneralEvent(tickets: GeneralTicket[]): string | null {
  if (!Array.isArray(tickets) || tickets.length === 0) {
    return 'Debe definir al menos un tipo de entrada';
  }

  for (const ticket of tickets) {
    // Validar que tenga todas las propiedades requeridas
    if (!ticket.name || ticket.name.trim() === '') {
      return 'El nombre del tipo de entrada es requerido';
    }
    if (!ticket.price || ticket.price <= 0) {
      return 'El precio debe ser mayor a 0';
    }
    if (!ticket.quantity || ticket.quantity < 1) {
      return 'La cantidad debe ser mayor a 0';
    }
  }

  // Verificar nombres duplicados
  const names = new Set();
  for (const ticket of tickets) {
    const lowerName = ticket.name.toLowerCase();
    if (names.has(lowerName)) {
      return 'No puede haber tipos de entrada con el mismo nombre';
    }
    names.add(lowerName);
  }

  return null;
}

function validateSeatingChart(seatingChart: SeatingChart): string | null {
  if (!seatingChart) {
    return 'La configuración de asientos es requerida';
  }

  // Validar dimensiones básicas
  if (!seatingChart.rows || seatingChart.rows < 1) {
    return 'El número de filas debe ser mayor a 0';
  }

  if (!seatingChart.columns || seatingChart.columns < 1) {
    return 'El número de columnas debe ser mayor a 0';
  }

  // Validar secciones
  if (!Array.isArray(seatingChart.sections) || seatingChart.sections.length === 0) {
    return 'Debe definir al menos una sección';
  }

  for (const section of seatingChart.sections) {
    // Validar propiedades requeridas
    if (!section.name || section.name.trim() === '') {
      return 'El nombre de la sección es requerido';
    }
    if (!section.type || !['REGULAR', 'VIP', 'DISABLED'].includes(section.type)) {
      return `Tipo de sección inválido en ${section.name}`;
    }
    if (!section.price || section.price <= 0) {
      return `Precio inválido en sección ${section.name}`;
    }

    // Validar límites de la sección
    if (section.rowStart < 1 || section.rowStart > seatingChart.rows) {
      return `Fila inicial inválida en sección ${section.name}`;
    }
    if (section.rowEnd < section.rowStart || section.rowEnd > seatingChart.rows) {
      return `Fila final inválida en sección ${section.name}`;
    }
    if (section.columnStart < 1 || section.columnStart > seatingChart.columns) {
      return `Columna inicial inválida en sección ${section.name}`;
    }
    if (section.columnEnd < section.columnStart || section.columnEnd > seatingChart.columns) {
      return `Columna final inválida en sección ${section.name}`;
    }
  }

  // Validar solapamiento de secciones si no es layout personalizado
  if (!seatingChart.customLayout) {
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

// En la función validateEvent
function validateEvent(data: any): string | null {
  // Validaciones básicas
  if (!data.name?.trim()) return 'El nombre del evento es requerido';
  if (!data.description?.trim()) return 'La descripción es requerida';
  if (!data.date) return 'La fecha es requerida';
  if (new Date(data.date) < new Date()) return 'La fecha debe ser futura';
  if (!data.location?.trim()) return 'La ubicación es requerida';
  
  // Validar tipo de evento
  if (!['SEATED', 'GENERAL'].includes(data.eventType)) {
    return 'Tipo de evento inválido';
  }

  // Validaciones específicas por tipo
  return data.eventType === 'SEATED' 
    ? validateSeatingChart(data.seatingChart)
    : validateGeneralEvent(data.generalTickets);
}

// Función para generar los asientos
async function generateSeatsForEvent(eventId: string, seatingChart: SeatingChart): Promise<SeatType[]> {
  const seats: SeatType[] = [];
  const { sections, customLayout } = seatingChart;

  if (customLayout && seatingChart.seats) {
    // Manejar layout personalizado
    return seatingChart.seats.map(seat => ({
      id: seat.id,
      eventId,
      row: seat.row,
      column: seat.column,
      sectionId: seat.sectionId,
      status: 'AVAILABLE',
      label: seat.label || `R${seat.row}C${seat.column}`,
      position: seat.position,
      price: sections.find(s => s.id === seat.sectionId)?.price || 0,
      type: sections.find(s => s.id === seat.sectionId)?.type || 'REGULAR'
    }));
  }

  // Generar asientos para layout regular
  for (const section of sections) {
    for (let row = section.rowStart; row <= section.rowEnd; row++) {
      for (let col = section.columnStart; col <= section.columnEnd; col++) {
        const rowLetter = String.fromCharCode(64 + row); // A = 65 en ASCII
        seats.push({
          id: `${eventId}-${rowLetter}${col}`,
          eventId,
          row: row - 1,
          column: col - 1,
          sectionId: section.id,
          status: 'AVAILABLE',
          label: `${rowLetter}${col}`,
          position: { x: col * 30, y: row * 30 },
          price: section.price,
          type: section.type
        });
      }
    }
  }

  return seats;
}

// Endpoint POST para crear eventos
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

    const validationError = validateEvent(data);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();

    try {
      // Preparar datos base del evento
      const baseEventData = {
        name: data.name,
        description: data.description,
        date: new Date(data.date),
        location: data.location,
        imageUrl: data.imageUrl || '',
        eventType: data.eventType,
        organizerId: user._id,
        mercadopago: {
          accessToken: user.mercadopago.accessToken,
          userId: user.mercadopago.userId
        },
        published: false
      };

      // Agregar datos específicos según el tipo de evento
      const eventData = data.eventType === 'SEATED' 
        ? {
            ...baseEventData,
            seatingChart: {
              rows: data.seatingChart.rows,
              columns: data.seatingChart.columns,
              sections: data.seatingChart.sections,
              customLayout: data.seatingChart.customLayout || false
            }
          }
        : {
            ...baseEventData,
            generalTickets: data.generalTickets.map((ticket: { name: any; price: any; quantity: any; description: any; }) => ({
              name: ticket.name,
              price: ticket.price,
              quantity: ticket.quantity,
              description: ticket.description
            }))
          };

      const [event] = await Event.create([eventData], { session: mongoSession });

      // Generar asientos solo si es evento con asientos
      let seats = [];
      if (data.eventType === 'SEATED') {
        seats = await generateSeatsForEvent(event._id.toString(), data.seatingChart);
        if (seats.length > 0) {
          await Seat.insertMany(seats, { session: mongoSession });
        }
      }

      await mongoSession.commitTransaction();

      return NextResponse.json({
        success: true,
        event: {
          ...event.toJSON(),
          totalSeats: seats.length,
          type: data.eventType
        }
      }, { status: 201 });

    } catch (error) {
      console.error('Transaction error:', error);
      await mongoSession.abortTransaction();
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