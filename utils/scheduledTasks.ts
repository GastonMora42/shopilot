import { Seat } from "@/app/models/Seat";

// utils/scheduledTasks.ts
export async function scheduleReservationCleanup() {
    setInterval(async () => {
      try {
        await Seat.updateMany(
          {
            status: 'RESERVED',
            'temporaryReservation.expiresAt': { $lt: new Date() }
          },
          {
            $set: { status: 'AVAILABLE' },
            $unset: {
              temporaryReservation: 1,
              ticketId: 1
            }
          }
        );
      } catch (error) {
        console.error('Error en la limpieza de reservas:', error);
      }
    }, 60000); // Ejecutar cada minuto
  }