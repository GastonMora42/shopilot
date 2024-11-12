import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Seat } from '@/app/models/Seat';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { seatIds, ticketId, paymentId } = body;

    if (!seatIds || !Array.isArray(seatIds) || !ticketId || !paymentId) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }

    // Confirmar asientos reservados
    const result = await Seat.updateMany(
      {
        _id: { $in: seatIds },
        status: 'RESERVED'
      },
      {
        $set: {
          status: 'OCCUPIED',
          ticketId
        },
        $unset: {
          temporaryReservation: 1
        }
      }
    );

    if (result.modifiedCount !== seatIds.length) {
      return NextResponse.json(
        { error: 'No se pudieron confirmar todos los asientos' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Asientos confirmados correctamente'
    });

  } catch (error) {
    console.error('Error al confirmar asientos:', error);
    return NextResponse.json(
      { error: 'Error al confirmar asientos' },
      { status: 500 }
    );
  }
}