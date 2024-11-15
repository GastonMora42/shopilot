// app/api/events/[id]/seats/cleanup/route.ts
import dbConnect from '@/app/lib/mongodb';
import { Seat } from '@/app/models/Seat';
import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    if (!isValidObjectId(params.id)) {
      return NextResponse.json({ error: 'ID de evento inválido' }, { status: 400 });
    }

    const result = await Seat.releaseExpiredSeats(params.id);

    return NextResponse.json({ 
      success: true,
      releasedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error in cleanup:', error);
    return NextResponse.json({ 
      error: 'Error in cleanup',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}