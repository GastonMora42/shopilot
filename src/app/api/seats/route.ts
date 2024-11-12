import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Seat } from '@/app/models/Seat';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'EventId es requerido' },
        { status: 400 }
      );
    }

    const seats = await Seat.find({ eventId }).select('-__v');
    return NextResponse.json({ seats });
  } catch (error) {
    console.error('Error al obtener asientos:', error);
    return NextResponse.json(
      { error: 'Error al obtener asientos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventId, seatIds, sessionId } = body;

    if (!eventId || !seatIds || !Array.isArray(seatIds) || !sessionId) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }

    // Verificar disponibilidad
    const seats = await Seat.find({
      _id: { $in: seatIds },
      eventId,
      status: 'AVAILABLE'
    });

    if (seats.length !== seatIds.length) {
      return NextResponse.json(
        { error: 'Algunos asientos ya no están disponibles' },
        { status: 400 }
      );
    }

    // Reservar asientos
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
    await Seat.updateMany(
      { _id: { $in: seatIds } },
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

    return NextResponse.json({
      success: true,
      message: 'Asientos reservados temporalmente',
      expiresAt
    });

  } catch (error) {
    console.error('Error al reservar asientos:', error);
    return NextResponse.json(
      { error: 'Error al reservar asientos' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'SessionId es requerido' },
        { status: 400 }
      );
    }

    // Liberar asientos por sessionId
    await Seat.updateMany(
      {
        'temporaryReservation.sessionId': sessionId,
        status: 'RESERVED'
      },
      {
        $set: { status: 'AVAILABLE' },
        $unset: {
          temporaryReservation: 1
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Asientos liberados correctamente'
    });

  } catch (error) {
    console.error('Error al liberar asientos:', error);
    return NextResponse.json(
      { error: 'Error al liberar asientos' },
      { status: 500 }
    );
  }
}