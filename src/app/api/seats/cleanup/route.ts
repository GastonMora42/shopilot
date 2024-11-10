// app/api/seats/cleanup/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Seat } from '@/app/models/Seat';

export async function POST(req: Request) {
  try {
    await dbConnect();
    
    const result = await Seat.updateMany(
      {
        status: 'RESERVED',
        reservationExpires: { $lt: new Date() }
      },
      {
        $set: { status: 'AVAILABLE' },
        $unset: { ticketId: 1, reservationExpires: 1 }
      }
    );

    return NextResponse.json({
      success: true,
      releasedSeats: result.modifiedCount
    });

  } catch (error) {
    console.error('Error cleaning up seats:', error);
    return NextResponse.json(
      { error: 'Error cleaning up seats' },
      { status: 500 }
    );
  }
}