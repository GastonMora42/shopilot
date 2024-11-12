// app/api/events/[id]/seats/route.ts
import dbConnect from '@/app/lib/mongodb';
import { Seat } from '@/app/models/Seat';
import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    console.log('Fetching seats for event:', params.id);

    const allSeats = await Seat.find({ 
      eventId: params.id 
    }).select('-__v');

    console.log('Found seats:', allSeats);

    const occupiedSeats = allSeats
      .filter(seat => seat.status !== 'AVAILABLE')
      .map(seat => ({
        seatId: seat.seatId,
        status: seat.status,
        type: seat.type,
        section: seat.section
      }));

    console.log('Filtered occupied seats:', occupiedSeats);

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

  } catch (error) {
    console.error('Error fetching seats:', error);
    return NextResponse.json(
      { error: 'Error al obtener los asientos' }, 
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { seatIds, sessionId } = await req.json();

    console.log('Attempting to reserve seats:', { seatIds, sessionId });

    if (!isValidObjectId(params.id)) {
      return NextResponse.json(
        { error: 'ID de evento inválido' },
        { status: 400 }
      );
    }

    if (!seatIds?.length || !sessionId) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }

    // Verificar disponibilidad
    const seats = await Seat.find({
      eventId: params.id,
      seatId: { $in: seatIds }
    });

    const unavailableSeats = seats.filter(seat => 
      seat.status !== 'AVAILABLE' && 
      !(seat.status === 'RESERVED' && 
        seat.temporaryReservation?.sessionId === sessionId)
    );

    if (unavailableSeats.length > 0) {
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

    // Configurar reserva temporal
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Reservar asientos
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
          }
        }
      }
    );

    console.log('Reserved seats:', result);

    return NextResponse.json({
      success: true,
      reservedCount: result.modifiedCount,
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('Error reserving seats:', error);
    return NextResponse.json(
      { error: 'Error al reservar los asientos' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { seatIds, status, sessionId } = await req.json();

    if (!isValidObjectId(params.id)) {
      return NextResponse.json(
        { error: 'ID de evento inválido' },
        { status: 400 }
      );
    }

    if (!seatIds?.length || !['AVAILABLE', 'OCCUPIED', 'RESERVED'].includes(status)) {
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

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'No se pudo actualizar ningún asiento' },
        { status: 400 }
      );
    }

    const updatedSeats = await Seat.find({
      eventId: params.id,
      seatId: { $in: seatIds }
    });

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
      seats: updatedSeats
    });

  } catch (error) {
    console.error('Error updating seats:', error);
    return NextResponse.json(
      { error: 'Error al actualizar los asientos' },
      { status: 500 }
    );
  }
}