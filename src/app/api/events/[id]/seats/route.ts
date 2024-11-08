// app/api/events/[id]/seats/route.ts
import dbConnect from '@/app/lib/mongodb';
import { Seat } from '@/app/models/Seat';
import { NextResponse } from 'next/server';
import { ISeat } from '@/types';

export async function GET(
  _req: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    await dbConnect();
    
    // Obtenemos todos los asientos ordenados
    const seats = await Seat.find({ 
      eventId: params.eventId 
    }).sort({ row: 1, column: 1 });

    // Organizamos los asientos en una matriz
    const seatingMatrix: ISeat[][] = [];
    let currentRow = -1;
    
    seats.forEach((seat) => {
      if (seat.row > currentRow) {
        seatingMatrix.push([]);
        currentRow = seat.row;
      }
      seatingMatrix[currentRow].push(seat.toObject());
    });

    // Obtenemos también un listado de asientos ocupados/reservados
    const occupiedSeats = seats
      .filter(seat => seat.status !== 'available')
      .map(seat => ({
        seatId: seat.seatId,
        status: seat.status
      }));

    return NextResponse.json({ 
      success: true, 
      seats: seatingMatrix,
      occupiedSeats
    });

  } catch (error) {
    console.error('Error fetching seats:', error);
    return NextResponse.json(
      { error: 'Error al obtener los asientos' }, 
      { status: 500 }
    );
  }
}

// Actualizar estado de asientos
export async function PATCH(
  req: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    await dbConnect();
    const body = await req.json();
    const { seatIds, status } = body;

    if (!seatIds || !Array.isArray(seatIds) || !status) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }

    // Actualizamos los asientos
    const result = await Seat.updateMany(
      {
        eventId: params.eventId,
        seatId: { $in: seatIds },
        status: 'available' // Solo permitimos actualizar asientos disponibles
      },
      { status }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'No se pudo actualizar ningún asiento' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error updating seats:', error);
    return NextResponse.json(
      { error: 'Error al actualizar los asientos' },
      { status: 500 }
    );
  }
}

// Endpoint para reservar asientos temporalmente
export async function POST(
  req: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    await dbConnect();
    const body = await req.json();
    const { seatIds } = body;

    if (!seatIds || !Array.isArray(seatIds)) {
      return NextResponse.json(
        { error: 'Selecciona asientos válidos' },
        { status: 400 }
      );
    }

    // Verificamos que los asientos estén disponibles
    const unavailableSeats = await Seat.find({
      eventId: params.eventId,
      seatId: { $in: seatIds },
      status: { $ne: 'available' }
    });

    if (unavailableSeats.length > 0) {
      return NextResponse.json({
        error: 'Algunos asientos no están disponibles',
        unavailableSeats: unavailableSeats.map(seat => seat.seatId)
      }, { status: 409 });
    }

    // Reservamos los asientos
    const result = await Seat.updateMany(
      {
        eventId: params.eventId,
        seatId: { $in: seatIds },
        status: 'available'
      },
      { status: 'reserved' }
    );

    // Programamos la liberación automática después de 15 minutos
    setTimeout(async () => {
      await Seat.updateMany(
        {
          eventId: params.eventId,
          seatId: { $in: seatIds },
          status: 'reserved'
        },
        { status: 'available' }
      );
    }, 15 * 60 * 1000);

    return NextResponse.json({
      success: true,
      reservedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error reserving seats:', error);
    return NextResponse.json(
      { error: 'Error al reservar los asientos' },
      { status: 500 }
    );
  }
}