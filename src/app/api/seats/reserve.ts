// pages/api/seats/reserve.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { SeatReservationService } from '@/app/services/seatReservation';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { eventId, seatIds, sessionId } = req.body;

  try {
    const result = await SeatReservationService.reserveSeats(
      eventId,
      seatIds,
      sessionId
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Error en el proceso de reserva' 
    });
  }
}