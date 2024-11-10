// app/lib/cleanupSeats.ts
import { Seat } from '@/app/models/Seat';
import { Ticket } from '@/app/models/Ticket';

export async function releaseExpiredSeats() {
  try {
    const now = new Date();

    // Encontrar asientos expiradossssssssssss
    const expiredSeats = await Seat.find({
      status: 'RESERVED',
      reservationExpires: { $lt: now }
    });

    if (expiredSeats.length === 0) {
      return;
    }

    console.log('Liberando asientos expirados:', expiredSeats.length);

    // Liberar asientos
    await Seat.updateMany(
      {
        _id: { $in: expiredSeats.map(seat => seat._id) }
      },
      {
        $set: {
          status: 'AVAILABLE',
          ticketId: null,
          reservationExpires: null
        }
      }
    );

    // Marcar tickets asociados como expirados
    const ticketIds = [...new Set(expiredSeats.map(seat => seat.ticketId).filter(Boolean))];
    
    await Ticket.updateMany(
      {
        _id: { $in: ticketIds },
        status: 'PENDING'
      },
      {
        $set: { status: 'FAILED' }
      }
    );

    console.log('Asientos liberados y tickets actualizados');
  } catch (error) {
    console.error('Error liberando asientos:', error);
  }
}