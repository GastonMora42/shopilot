import { Seat } from "@/app/models/Seat";

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
  ) {
    try {
      const { seatIds, sessionId } = await request.json();
  
      const seats = await Seat.find({
        eventId: params.id,
        seatId: { $in: seatIds },
        $or: [
          { status: 'AVAILABLE' },
          {
            status: 'RESERVED',
            'temporaryReservation.sessionId': sessionId
          }
        ]
      });
  
      const available = seats.length === seatIds.length;
  
      return Response.json({
        success: available,
        unavailableSeats: available ? [] : seatIds.filter(
            (id: string) => !seats.find(seat => seat.seatId === id)
        )
      });
    } catch (error) {
      console.error('Seat verification error:', error);
      return Response.json({
        success: false,
        error: 'Error al verificar asientos'
      }, { status: 500 });
    }
  }