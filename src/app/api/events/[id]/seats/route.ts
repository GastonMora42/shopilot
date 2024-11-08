// app/api/events/[id]/seats/route.ts
import dbConnect from '@/app/lib/mongodb';
import { Seat, ISeat } from '@/app/models/Seat';
import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';

// app/api/events/[id]/seats/route.ts
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    console.log('Fetching seats for event:', params.id); // Debug log

    const seats = await Seat.find({ 
      eventId: params.id 
    });

    console.log('Raw seats from DB:', seats); // Debug log

    // Obtener solo los asientos ocupados y reservados
    const occupiedSeats = seats
      .filter(seat => seat.status === 'OCCUPIED' || seat.status === 'RESERVED')
      .map(seat => ({
        seatId: seat.number, // Importante: usar seat.number que es el formato "A4"
        status: seat.status
      }));

    console.log('Filtered occupied seats:', occupiedSeats); // Debug log

    return NextResponse.json({ 
      success: true, 
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

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const body = await req.json();
    const { seatIds, status } = body;

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

    // Actualizar asientos
    const result = await Seat.updateMany(
      {
        eventId: params.id,
        seatId: { $in: seatIds },
        status: 'AVAILABLE' // Solo actualizar si están disponibles
      },
      { status }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'No se pudo actualizar ningún asiento' },
        { status: 400 }
      );
    }

    // Obtener asientos actualizados
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

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const body = await req.json();
    const { seatIds } = body;

    if (!isValidObjectId(params.id)) {
      return NextResponse.json(
        { error: 'ID de evento inválido' },
        { status: 400 }
      );
    }

    if (!seatIds?.length) {
      return NextResponse.json(
        { error: 'Selecciona asientos válidos' },
        { status: 400 }
      );
    }

    // Verificar disponibilidad
    const seats = await Seat.find({
      eventId: params.id,
      seatId: { $in: seatIds }
    });

    const unavailableSeats = seats.filter(seat => seat.status !== 'AVAILABLE');

    if (unavailableSeats.length > 0) {
      return NextResponse.json({
        error: 'Algunos asientos no están disponibles',
        unavailableSeats: unavailableSeats.map(seat => ({
          seatId: seat.seatId,
          status: seat.status,
          type: seat.type
        }))
      }, { status: 409 });
    }

    // Reservar asientos
    const result = await Seat.updateMany(
      {
        eventId: params.id,
        seatId: { $in: seatIds },
        status: 'AVAILABLE'
      },
      { status: 'RESERVED' }
    );

    // Programar liberación automática
    setTimeout(async () => {
      try {
        await Seat.updateMany(
          {
            eventId: params.id,
            seatId: { $in: seatIds },
            status: 'RESERVED' // Solo liberar si siguen reservados
          },
          { status: 'AVAILABLE' }
        );
        console.log('Seats released:', seatIds);
      } catch (error) {
        console.error('Error releasing seats:', error);
      }
    }, 15 * 60 * 1000); // 15 minutos

    return NextResponse.json({
      success: true,
      reservedCount: result.modifiedCount,
      seats: await Seat.find({
        eventId: params.id,
        seatId: { $in: seatIds }
      })
    });

  } catch (error) {
    console.error('Error reserving seats:', error);
    return NextResponse.json(
      { error: 'Error al reservar los asientos' },
      { status: 500 }
    );
  }
}