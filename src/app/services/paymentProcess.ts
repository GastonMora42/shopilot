import mongoose from "mongoose";
import { Ticket } from "../models/Ticket";
import { SeatReservationService } from "./seatReservation";

// services/paymentProcess.ts
export async function handlePaymentSuccess(
    paymentId: string,
    ticketId: string,
    seatIds: string[]
  ): Promise<boolean> {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      // Actualizar ticket
      await Ticket.findByIdAndUpdate(
        ticketId,
        {
          status: 'PAID',
          paymentId
        },
        { session }
      );
  
      // Confirmar asientos
      await SeatReservationService.confirmSeats(seatIds, ticketId);
  
      await session.commitTransaction();
      return true;
    } catch (error) {
      await session.abortTransaction();
      return false;
    } finally {
      session.endSession();
    }
  }