// app/api/events/[id]/seats/route.ts
import dbConnect from '@/app/lib/mongodb';
import { Seat } from '@/app/models/Seat';
import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';

interface MongoError extends Error {
  code?: number;
  name: string;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Iniciando conexión a DB...');
    await dbConnect();
    console.log('Conexión exitosa a DB');

    if (!isValidObjectId(params.id)) {
      console.log('ID inválido:', params.id);
      return NextResponse.json({ 
        error: 'ID de evento inválido' 
      }, { status: 400 });
    }

    console.log('Buscando asientos para evento:', params.id);
    const allSeats = await Seat.find({ 
      eventId: params.id 
    }).select('-__v').lean();

    if (!allSeats) {
      console.log('No se encontraron asientos');
      return NextResponse.json({ 
        success: true, 
        occupiedSeats: [],
        debug: { totalSeats: 0, occupiedCount: 0, statuses: [] }
      });
    }

    console.log(`Encontrados ${allSeats.length} asientos`);

    const occupiedSeats = allSeats
      .filter(seat => seat.status !== 'AVAILABLE')
      .map(seat => ({
        seatId: seat.seatId,
        status: seat.status,
        type: seat.type,
        section: seat.section
      }));

    console.log(`${occupiedSeats.length} asientos ocupados`);

    return NextResponse.json({ 
      success: true, 
      occupiedSeats,
      debug: {
        totalSeats: allSeats.length,
        occupiedCount: occupiedSeats.length,
        statuses: allSeats.map(s => ({ 
          id: s.seatId, 
          status: s.status,
          reservation: s.temporaryReservation 
        }))
      }
    });

  } catch (err: unknown) {
    const error = err as MongoError;
    
    console.error('Error detallado:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });

    if (error.name === 'MongoServerSelectionError') {
      return NextResponse.json({
        error: 'Error de conexión a la base de datos. Por favor, intente nuevamente.',
        retry: true
      }, { status: 503 });
    }

    return NextResponse.json({
      error: 'Error al obtener los asientos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Iniciando conexión para reserva...');
    await dbConnect();
    console.log('Conexión exitosa');

    const { seatIds, sessionId } = await req.json();
    console.log('Datos de reserva:', { seatIds, sessionId });

    if (!isValidObjectId(params.id)) {
      console.log('ID de evento inválido:', params.id);
      return NextResponse.json(
        { error: 'ID de evento inválido' },
        { status: 400 }
      );
    }

    if (!seatIds?.length || !sessionId) {
      console.log('Datos inválidos:', { seatIds, sessionId });
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }

    let seats;
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        seats = await Seat.find({
          eventId: params.id,
          seatId: { $in: seatIds }
        }).lean();
        console.log(`Intento ${i + 1}: Asientos encontrados:`, seats.length);
        break;
      } catch (error) {
        console.log(`Intento ${i + 1} fallido:`, error);
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }

    if (!seats || seats.length === 0) {
      console.log('No se encontraron asientos');
      return NextResponse.json({
        error: 'No se encontraron los asientos solicitados',
        seatIds
      }, { status: 404 });
    }

    if (seats.length !== seatIds.length) {
      console.log('No se encontraron todos los asientos solicitados');
      return NextResponse.json({
        error: 'Algunos asientos solicitados no existen',
        found: seats.length,
        requested: seatIds.length
      }, { status: 400 });
    }

    const unavailableSeats = seats.filter(seat => 
      seat.status !== 'AVAILABLE' && 
      !(seat.status === 'RESERVED' && 
        seat.temporaryReservation?.sessionId === sessionId)
    );

    if (unavailableSeats.length > 0) {
      console.log('Asientos no disponibles:', unavailableSeats);
      return NextResponse.json({
        error: 'Algunos asientos no están disponibles',
        unavailableSeats: unavailableSeats.map(seat => ({
          seatId: seat.seatId,
          status: seat.status,
          type: seat.type,
          section: seat.section
        }))
      }, { status: 409 });
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const result = await Seat.updateMany(
      {
        eventId: params.id,
        seatId: { $in: seatIds },
        $or: [
          { status: 'AVAILABLE' },
          {
            status: 'RESERVED',
            'temporaryReservation.sessionId': sessionId
          }
        ]
      },
      {
        $set: {
          status: 'RESERVED',
          temporaryReservation: {
            sessionId,
            expiresAt
          },
          lastReservationAttempt: new Date()
        }
      }
    );

    console.log('Resultado de actualización:', {
      modifiedCount: result.modifiedCount,
      expectedCount: seatIds.length
    });

    if (result.modifiedCount !== seatIds.length) {
      console.log('Revirtiendo cambios por actualización incompleta');
      await Seat.updateMany(
        {
          eventId: params.id,
          seatId: { $in: seatIds },
          'temporaryReservation.sessionId': sessionId
        },
        {
          $set: { status: 'AVAILABLE' },
          $unset: { 
            temporaryReservation: 1,
            lastReservationAttempt: 1
          }
        }
      );

      return NextResponse.json({
        error: 'No se pudieron reservar todos los asientos seleccionados',
        unavailableSeats: seatIds
      }, { status: 409 });
    }

    const updatedSeats = await Seat.find({
      eventId: params.id,
      seatId: { $in: seatIds }
    }).lean();

    return NextResponse.json({
      success: true,
      reservedCount: result.modifiedCount,
      seats: updatedSeats,
      expiresAt: expiresAt.toISOString()
    });

  } catch (err: unknown) {
    const error = err as MongoError;
    
    console.error('Error detallado en reserva:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    if (error.name === 'MongoServerSelectionError') {
      return NextResponse.json({
        error: 'Error de conexión. Por favor, intente nuevamente.',
        retry: true
      }, { status: 503 });
    }

    return NextResponse.json({
      error: 'Error al reservar los asientos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Iniciando conexión para actualización...');
    await dbConnect();
    console.log('Conexión exitosa');

    const { seatIds, status, sessionId } = await req.json();
    console.log('Datos de actualización:', { seatIds, status, sessionId });

    if (!isValidObjectId(params.id)) {
      console.log('ID de evento inválido:', params.id);
      return NextResponse.json(
        { error: 'ID de evento inválido' },
        { status: 400 }
      );
    }

    if (!seatIds?.length || !['AVAILABLE', 'OCCUPIED', 'RESERVED'].includes(status)) {
      console.log('Datos inválidos:', { seatIds, status });
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }

    const updateQuery = status === 'AVAILABLE' 
      ? {
          $set: { status },
          $unset: { 
            temporaryReservation: 1,
            ticketId: 1,
            lastReservationAttempt: 1
          }
        }
      : {
          $set: {
            status,
            ...(sessionId && {
              temporaryReservation: {
                sessionId,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000)
              }
            }),
            lastReservationAttempt: new Date()
          }
        };

    const result = await Seat.updateMany(
      {
        eventId: params.id,
        seatId: { $in: seatIds },
        $or: [
          { status: 'AVAILABLE' },
          { 'temporaryReservation.sessionId': sessionId }
        ]
      },
      updateQuery
    );

    console.log('Resultado de actualización:', {
      modifiedCount: result.modifiedCount,
      expectedCount: seatIds.length
    });

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'No se pudo actualizar ningún asiento' },
        { status: 400 }
      );
    }

    const updatedSeats = await Seat.find({
      eventId: params.id,
      seatId: { $in: seatIds }
    }).lean();

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
      seats: updatedSeats
    });

  } catch (err: unknown) {
    const error = err as MongoError;
    
    console.error('Error detallado en actualización:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    if (error.name === 'MongoServerSelectionError') {
      return NextResponse.json({
        error: 'Error de conexión. Por favor, intente nuevamente.',
        retry: true
      }, { status: 503 });
    }

    return NextResponse.json({
      error: 'Error al actualizar los asientos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}