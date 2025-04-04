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
  PaymentMethod
} from '@/types/event';
import { SeatingChart } from '@/types';
import { creditCheck } from '@/app/middlewares/creditCheck';
import { CreditService } from '@/app/services/creditService';

// Interfaces para datos bancarios
interface BankAccountData {
  accountName: string;
  cbu: string;
  bank: string;
  additionalNotes?: string;
}

// Interfaces para MercadoPago
interface MercadoPagoData {
  accessToken: string;
  userId: string;
}

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

// Validar datos bancarios si es método de transferencia
function validateBankData(paymentMethod: string, bankAccountData?: any, user?: any): string | null {
  if (paymentMethod !== 'BANK_TRANSFER') {
    return null;
  }
  
  // Si hay datos personalizados, validarlos
  if (bankAccountData) {
    if (!bankAccountData.accountName || bankAccountData.accountName.trim() === '') {
      return 'El nombre de la cuenta bancaria es requerido';
    }
    if (!bankAccountData.cbu || bankAccountData.cbu.trim() === '') {
      return 'El CBU/CVU es requerido';
    }
    if (!bankAccountData.bank || bankAccountData.bank.trim() === '') {
      return 'El nombre del banco es requerido';
    }
    return null;
  }
  
  // Si no hay datos personalizados, verificar que el usuario tenga datos bancarios configurados
  if (!user?.bankAccount?.accountName || !user?.bankAccount?.cbu || !user?.bankAccount?.bank) {
    return 'No hay datos bancarios configurados. Configúralos en tu perfil o proporciónalos para este evento.';
  }
  
  return null;
}

// En la función validateEvent
function validateEvent(data: any, user: any): string | null {
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
  
  // Validar método de pago
  if (!['MERCADOPAGO', 'BANK_TRANSFER'].includes(data.paymentMethod)) {
    return 'Método de pago inválido';
  }
  
  // Si es MercadoPago, verificar que el usuario tenga una cuenta vinculada
  if (data.paymentMethod === 'MERCADOPAGO' && (!user?.mercadopago?.accessToken || !user?.mercadopago?.userId)) {
    return 'Debes vincular tu cuenta de MercadoPago para usar este método de pago';
  }
  
  // Validar datos bancarios si es transferencia
  const bankDataError = validateBankData(data.paymentMethod, data.bankAccountData, user);
  if (bankDataError) return bankDataError;

  // Validaciones específicas por tipo
  return data.eventType === 'SEATED' 
    ? validateSeatingChart(data.seatingChart)
    : validateGeneralEvent(data.generalTickets);
}

// Función para generar los asientos
async function generateSeatsForEvent(eventId: string, seatingChart: SeatingChart): Promise<ISeat[]> {
  const seats: ISeat[] = [];
  const { sections } = seatingChart;

  sections.forEach(section => {
    // No restar 1 aquí, mantener los índices originales
    const rowStart = section.rowStart;
    const rowEnd = section.rowEnd;
    const colStart = section.columnStart;
    const colEnd = section.columnEnd;

    for (let row = rowStart; row <= rowEnd; row++) {
      for (let col = colStart; col <= colEnd; col++) {
        const rowLetter = String.fromCharCode(65 + row); // El mapeo a letras es correcto
        const seatId = `${rowLetter}${col.toString().padStart(2, '0')}`;
        
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
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const data = await req.json();
    console.log('Received event data:', data);

    // Validar los datos del evento con el usuario
    const validationError = validateEvent(data, user);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
 
    mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();

    try {
      // Preparar datos base del evento
      const baseEventData: any = {
        name: data.name,
        description: data.description,
        date: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : undefined, // Añadimos la fecha de finalización
        location: data.location,
        imageUrl: data.imageUrl || '',
        eventType: data.eventType,
        organizerId: user._id,
        paymentMethod: data.paymentMethod || 'MERCADOPAGO',
        published: false,
        maxTicketsPerPurchase: data.maxTicketsPerPurchase || 10
      };

      // Agregar datos específicos según el tipo de pago
      if (data.paymentMethod === 'MERCADOPAGO') {
        // Verificar que el usuario tiene datos de MercadoPago configurados
        if (!user.mercadopago?.accessToken || !user.mercadopago?.userId) {
          return NextResponse.json(
            { error: 'No tienes configurada una cuenta de MercadoPago' },
            { status: 400 }
          );
        }
        
        baseEventData.mercadopago = {
          accessToken: user.mercadopago.accessToken,
          userId: user.mercadopago.userId
        };
      } else if (data.paymentMethod === 'BANK_TRANSFER') {
        // Usar datos bancarios personalizados o del perfil del usuario
        let bankAccountData: BankAccountData | null = null;
        
        // Verificar si hay datos bancarios personalizados
        if (data.bankAccountData?.accountName && data.bankAccountData?.cbu && data.bankAccountData?.bank) {
          bankAccountData = {
            accountName: data.bankAccountData.accountName,
            cbu: data.bankAccountData.cbu,
            bank: data.bankAccountData.bank,
            additionalNotes: data.bankAccountData.additionalNotes || ''
          };
        } 
        // Verificar si hay datos bancarios en el perfil
        else if (user.bankAccount?.accountName && user.bankAccount?.cbu && user.bankAccount?.bank) {
          bankAccountData = {
            accountName: user.bankAccount.accountName,
            cbu: user.bankAccount.cbu,
            bank: user.bankAccount.bank,
            additionalNotes: user.bankAccount.additionalNotes || ''
          };
        }
        
        // Verificar si se encontraron datos bancarios
        if (!bankAccountData) {
          return NextResponse.json(
            { error: 'No hay datos bancarios disponibles para transferencia' },
            { status: 400 }
          );
        }
        
        baseEventData.bankAccountData = bankAccountData;
      }

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
            seats = await Seat.insertMany(seatsData, { 
              session: mongoSession,
              ordered: true // Para asegurar la inserción ordenada
            });
          } catch (error) {
            console.error('Error al crear los asientos:', error);
            throw new Error('Error al crear los asientos del evento');
          }
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
      if (mongoSession) await mongoSession.abortTransaction();
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