// app/api/events/[id]/seats/test/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Seat } from '@/app/models/Seat';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { seatId, status } = await req.json();

    const result = await Seat.findOneAndUpdate(
      { 
        eventId: params.id,
        number: seatId // Asumiendo que number es como "A4"
      },
      { 
        $set: { status: status }
      },
      { new: true }
    );

    console.log('Updated seat:', result);

    return NextResponse.json({ success: true, seat: result });
  } catch (error) {
    console.error('Error updating seat:', error);
    return NextResponse.json({ error: 'Error updating seat' }, { status: 500 });
  }
}