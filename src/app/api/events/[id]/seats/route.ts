// app/api/events/[eventId]/seats/route.ts
import  dbConnect  from '@/app/lib/mongodb';
import { Seat } from '@/app/models/Seat';
import { NextResponse } from 'next/server';
import { ISeat } from '@/types';

export async function GET(
  req: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    await dbConnect();
    
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
      seatingMatrix[currentRow].push(seat.toObject()); // Convertimos el documento de Mongoose a objeto plano
    });

    return NextResponse.json({ 
      success: true, 
      seats: seatingMatrix 
    });

  } catch (error: any) {
    console.error('Error fetching seats:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener los asientos' }, 
      { status: 500 }
    );
  }
}