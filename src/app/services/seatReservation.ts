import mongoose from "mongoose";
import { Seat } from "../models/Seat";

// services/seatReservation.ts
export class SeatReservationService {
    private static RESERVATION_TIMEOUT = 15 * 60 * 1000; // 15 minutos
  
    static async reserveSeats(
      eventId: string, 
      seatIds: string[], 
      sessionId: string
    ): Promise<{ success: boolean; error?: string }> {
      const session = await mongoose.startSession();
      session.startTransaction();
  
      try {
        // Verificar disponibilidad de asientos
        const seats = await Seat.find({
          _id: { $in: seatIds },
          eventId,
          status: 'AVAILABLE'
        }).session(session);
  
        if (seats.length !== seatIds.length) {
          throw new Error('Algunos asientos ya no están disponibles');
        }
  
        // Reservar asientos
        const expiresAt = new Date(Date.now() + this.RESERVATION_TIMEOUT);
        await Seat.updateMany(
          { _id: { $in: seatIds } },
          {
            $set: {
              status: 'RESERVED',
              temporaryReservation: {
                sessionId,
                expiresAt
              },
              lastReservationAttempt: new Date()
            }
          },
          { session }
        );
  
        await session.commitTransaction();
        return { success: true };
  
      } catch (error) {
        await session.abortTransaction();
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Error en la reserva' 
        };
      } finally {
        session.endSession();
      }
    }
  
    static async confirmSeats(seatIds: string[], ticketId: string): Promise<boolean> {
      const result = await Seat.updateMany(
        { _id: { $in: seatIds } },
        {
          $set: {
            status: 'OCCUPIED',
            ticketId
          },
          $unset: {
            temporaryReservation: 1
          }
        }
      );
      return result.modifiedCount === seatIds.length;
    }
  
    static async releaseSeats(seatIds: string[]): Promise<boolean> {
      const result = await Seat.updateMany(
        { _id: { $in: seatIds } },
        {
          $set: { status: 'AVAILABLE' },
          $unset: {
            temporaryReservation: 1,
            ticketId: 1
          }
        }
      );
      return result.modifiedCount === seatIds.length;
    }
  }