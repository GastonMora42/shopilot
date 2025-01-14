import { SeatStatus, SeatType } from "./base";

export interface Seat {
    _id: string;
    eventId: string;
    seatId: string;
    row: number;
    column: number;
    status: SeatStatus;
    type: SeatType;
    price: number;
    section: string;
    label: string;
    temporaryReservation?: {
      sessionId: string;
      expiresAt: Date;
    };
  }