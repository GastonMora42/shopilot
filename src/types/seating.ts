import { SeatStatus, SeatType } from ".";

// types/seating.ts
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
  sectionId: string; 
  position?: { 
    x: number; 
    y: number; 
  };
  screenPosition?: { 
    x: number; 
    y: number; 
  };
  temporaryReservation?: {
    sessionId: string;
    expiresAt: Date;
  };
  lastReservationAttempt?: Date;
}

export interface Section {
  id: string;
  name: string;
  type: SeatType;
  price: number;
  rowStart: number;
  rowEnd: number;
  columnStart: number;
  columnEnd: number;
  color: string;
  capacity?: number;
  availableSeats?: number;
}

export interface SeatingChart {
  rows: number;
  columns: number;
  sections: Section[];
  seats?: Seat[];
  customLayout?: boolean;
}