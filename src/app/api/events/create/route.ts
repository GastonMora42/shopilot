// app/api/events/create/route.ts

import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Event } from '@/app/models/Event';
import { ISeat, Seat } from '@/app/models/Seat';
import { User } from '@/app/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import mongoose from 'mongoose';
import { 
  GeneralTicket, 
} from '@/types/event';
import { SeatingChart } from '@/types';
import { creditCheck } from '@/app/middlewares/creditCheck';
import { CreditService } from '@/app/services/creditService';


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

  // Crear una matriz para verificar superposición
  const grid: string[][] = Array(seatingChart.rows).fill(null)
    .map(() => Array(seatingChart.columns).fill(null));

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
    const rowStart = section.rowStart - 1;
    const rowEnd = section.rowEnd - 1;
    const colStart = section.columnStart - 1;
    const colEnd = section.columnEnd - 1;

    if (rowStart < 0 || rowStart >= seatingChart.rows ||
        rowEnd < rowStart || rowEnd >= seatingChart.rows ||
        colStart < 0 || colStart >= seatingChart.columns ||
        colEnd < colStart || colEnd >= seatingChart.columns) {
      return `Límites inválidos en sección ${section.name}`;
    }

    // Verificar superposición
    for (let row = rowStart; row <= rowEnd; row++) {
      for (let col = colStart; col <= colEnd; col++) {
        if (grid[row][col] !== null) {
          return `La sección ${section.name} se superpone con ${grid[row][col]}`;
        }
        grid[row][col] = section.name;
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
// En api/events/create/route.ts
async function generateSeatsForEvent(eventId: string, seatingChart: SeatingChart): Promise<ISeat[]> {
  const seats: ISeat[] = [];
  const { sections } = seatingChart;

  // Ajustar índices para que empiecen desde 0
  sections.forEach(section => {
    const rowStart = section.rowStart - 1;
    const rowEnd = section.rowEnd - 1;
    const colStart = section.columnStart - 1;
    const colEnd = section.columnEnd - 1;

    for (let row = rowStart; row <= rowEnd; row++) {
      for (let col = colStart; col <= colEnd; col++) {
        const rowLetter = String.fromCharCode(65 + row);
        const seatId = `${rowLetter}${(col + 1).toString().padStart(2, '0')}`;
        
        seats.push({
          eventId: new mongoose.Types.ObjectId(eventId),
          seatId,
          section: section.name,
          row,
          column: col,
          status: 'AVAILABLE',
          type: section.type,
          price: section.price,
          label: seatId
        } as ISeat);
      }
    }
  });

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

     // Verificar créditos antes de continuar
     const creditCheckResult = await creditCheck(data, user._id.toString());
     if (creditCheckResult.error) {
       return NextResponse.json({ error: creditCheckResult.error }, { status: 400 });
     }
 
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
        const seatsData = await generateSeatsForEvent(event._id.toString(), data.seatingChart);
        if (seatsData.length > 0) {
          try {
            await Seat.insertMany(seatsData, { 
              session: mongoSession,
              ordered: true // Para asegurar la inserción ordenada
            });
          } catch (error) {
            console.error('Error al crear los asientos:', error);
            throw new Error('Error al crear los asientos del evento');
          }
        }
      }

      if (data.status === 'PUBLISHED') {
        const credits = creditCheckResult.requiredCredits || 0;
        await CreditService.deductCredits(
          user._id.toString(), 
          credits,
          event._id.toString()
        );
      }

      await mongoSession.commitTransaction();

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