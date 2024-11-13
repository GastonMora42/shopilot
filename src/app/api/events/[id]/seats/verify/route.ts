import dbConnect from "@/app/lib/mongodb";
import { Seat } from "@/app/models/Seat";
import { NextResponse } from "next/server";

// api/events/[id]/seats/verify/route.ts
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { seatIds, sessionId } = await req.json();

    console.log('Verifying seats:', { seatIds, sessionId });

    // Verificar disponibilidad real de los asientos
    const seats = await Seat.find({
      eventId: params.id,
      seatId: { $in: seatIds }
    });

    const unavailableSeats = seats.filter(seat => 
      seat.status !== 'AVAILABLE' && 
      !(seat.status === 'RESERVED' && 
        seat.temporaryReservation?.sessionId === sessionId)
    );

    if (unavailableSeats.length > 0) {
      return NextResponse.json({
        error: 'Algunos asientos no están disponibles',
        unavailableSeats: unavailableSeats.map(seat => ({
          seatId: seat.seatId,
          status: seat.status,
          reservedBy: seat.temporaryReservation?.sessionId === sessionId ? 'you' : 'other'
        }))
      }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      availableSeats: seatIds
    });

  } catch (error) {
    console.error('Error verifying seats:', error);
    return NextResponse.json(
      { error: 'Error al verificar los asientos' },
      { status: 500 }
    );
  }
}