// app/api/seats/cleanup/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Seat } from '@/app/models/Seat';

// app/api/seats/cleanup/route.ts o similar
export async function GET() {
  try {
    await dbConnect();

    const result = await Seat.updateMany(
      {
        status: 'RESERVED',
        'temporaryReservation.expiresAt': { $lt: new Date() }
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
      success: true,
      clearedSeats: result.modifiedCount
    });
  } catch (error) {
    console.error('Error in cleanup:', error);
    return NextResponse.json(
      { error: 'Error en la limpieza de asientos' },
      { status: 500 }
    );
  }
}