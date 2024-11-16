// app/api/events/[id]/seats/test/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Seat } from '@/app/models/Seat';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  try {
    await dbConnect();
    const { seatId, status } = await req.json();

    // Validaciones
    if (!seatId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['AVAILABLE', 'OCCUPIED', 'RESERVED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Buscar y actualizar el asiento
    const result = await Seat.findOneAndUpdate(
      { 
        eventId: params.id,
        row: parseInt(seatId.split('-')[0]),
        column: parseInt(seatId.split('-')[1])
      },
      { $set: { status } },
      { 
        new: true,
        runValidators: true
      }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Seat not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      seat: {
        id: result._id,
        eventId: result.eventId,
        row: result.row,
        column: result.column,
        status: result.status,
        updatedAt: result.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating seat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}