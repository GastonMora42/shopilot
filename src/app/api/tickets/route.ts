import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Event } from '@/app/models/Event';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import { generateQRCode } from '@/app/lib/utils';
import { createPreference } from '@/app/lib/mercadopago';
import { isValidObjectId } from 'mongoose';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  let session = null;
  
  try {
    await dbConnect();
    const { eventId, seats, buyerInfo, sessionId } = await req.json();
    
    console.log('Creating ticket request:', { eventId, seats, buyerInfo, sessionId });

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

    // Calcular precio total (modificado para trabajar con formato numérico)
    const total = seats.reduce((sum: number, seat: string) => {
      const [row, col] = seat.split('-');
      const rowNumber = parseInt(row);
      
      const section = event.seatingChart.sections.find((s: { rowStart: number; rowEnd: number; }) => 
        rowNumber >= s.rowStart && rowNumber <= s.rowEnd
      );

      if (!section) {
        throw new Error(`Sección no encontrada para el asiento ${seat}`);
      }

      return sum + section.price;
    }, 0);

    session = await mongoose.startSession();
    session.startTransaction();

    // Verificar disponibilidad usando seatId en lugar de number
    const seatsStatus = await Seat.find({
      eventId,
      seatId: { $in: seats }, // Cambiado de number a seatId
      $or: [
        { status: { $ne: 'RESERVED'} }, //Cambiamos
        {
          status: 'RESERVED',
          'temporaryReservation.sessionId': { $ne: sessionId }
        }
      ]
    }).session(session);

    if (seatsStatus.length > 0) {
      throw new Error('Algunos asientos no están disponibles o no están reservados para esta sesión');
    }

    // Crear ticket
    const [newTicket] = await Ticket.create([{
      eventId,
      seats, // Estos son los seatIds en formato numérico
      qrCode: await generateQRCode(),
      status: 'PENDING',
      buyerInfo: {
        ...buyerInfo,
        email: buyerInfo.email.toLowerCase().trim()
      },
      price: total
    }], { session });

    // Actualizar estado de asientos
    const seatUpdateResult = await Seat.updateMany(
      {
        eventId,
        seatId: { $in: seats }, // Cambiado de number a seatId
        'temporaryReservation.sessionId': sessionId
      },
      {
        $set: {
          ticketId: newTicket._id,
          status: 'RESERVED'
        }
      },
      { session }
    );
    
        if (seatUpdateResult.modifiedCount !== seats.length) {
          throw new Error('No se pudieron actualizar todos los asientos');
        }
    
        // Crear preferencia de MercadoPago
        const preference = await createPreference({
          _id: newTicket._id.toString(),
          eventName: event.name,
          price: newTicket.price,
          description: `${seats.length} entrada(s) para ${event.name}`
        });
    
        await session.commitTransaction();
    
        console.log('Ticket created successfully:', {
          id: newTicket._id,
          seats: newTicket.seats,
          status: newTicket.status
        });
    
        console.log('Preference created:', {
          ticketId: newTicket._id,
          preferenceId: preference.id
        });
    
        return NextResponse.json({
          success: true,
          ticket: {
            id: newTicket._id,
            seats: newTicket.seats,
            total: newTicket.price
          },
          checkoutUrl: preference.init_point,
          preferenceId: preference.id
        });
    
      } catch (error) {
        if (session) {
          await session.abortTransaction();
        }
        console.error('Error creating ticket:', error);
        return NextResponse.json(
          { 
            error: error instanceof Error ? error.message : 'Error al procesar la compra'
          },
          { status: 500 }
        );
      } finally {
        if (session) {
          await session.endSession();
        }
      }
    }