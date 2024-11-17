// types/index.ts
import { ObjectId, Document } from 'mongoose';

// Status como types para reutilización
export type TicketStatus = 'PENDING' | 'PAID' | 'USED' | 'CANCELLED';
export type SeatStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
export type SeatType = 'REGULAR' | 'VIP' | 'DISABLED';

export interface ISection {
  name: string;
  type: SeatType;
  price: number;
  rowStart: number;
  rowEnd: number;
  columnStart: number;
  columnEnd: number;
}

export interface ISeat extends Document {
  _id: ObjectId;
  eventId: ObjectId;
  row: number;
  column: number;
  number: string;
  status: SeatStatus;
  price: number;
  type: SeatType;
  ticketId?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITicket extends Document {
  _id: string;
  eventId: ObjectId;
  seats: string[];
  buyerInfo: {
    name: string;
    email: string;
    dni: string;
    phone?: string;
  };
  qrCode: string;
  status: TicketStatus;
  paymentId?: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketValidation {
  success: boolean;
  ticket?: {
    eventName: string;
    buyerName: string;
    seatNumber: string;
    status: TicketStatus;
  };
  error?: string;
}

export interface CreateTicketRequest {
  eventId: string;
  seats: string[];
  buyerInfo: {
    name: string;
    email: string;
    dni: string;
    phone?: string;
  };
}

export interface PreferenceData {
  _id: string;
  eventName: string;
  price: number;
  description: string;
  seats?: string;
}

// Interfaces adicionales para respuestas de API
export interface TicketResponse {
  success: boolean;
  ticket?: {
    id: string;
    status: TicketStatus;
    eventName: string;
    date: string;
    location: string;
    seats: string[];
    qrCode: string;
    buyerInfo: {
      name: string;
      email: string;
    };
    price: number;
  };
  error?: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  status?: TicketStatus;
  paymentId?: string;
  error?: string;
}

export interface MercadoPagoWebhookData {
  type: string;
  data: {
    id: string;
    status: string;
    external_reference: string;
  };
}

export interface SeatReservation {
  sessionId: string;
  expiresAt: Date;
}

export interface ReservationResponse {
  success: boolean;
  expiresAt: string;
  error?: string;
  unavailableSeats?: string[];
}

// Nuevas interfaces para tipos de eventos
interface IBaseEvent {
  _id: string;
  name: string;
  slug: string;
  description: string;
  date: Date;
  location: string;
  published: boolean;
  organizerId: string;
  imageUrl: string;
  mercadopago: {
    accessToken: string;
    userId: string;
  };
}

interface IGeneralEvent extends IBaseEvent {
  eventType: 'GENERAL';
  ticketTypes: Array<{
    name: string;
    price: number;
    quantity: number;
    description?: string;
  }>;
}

interface ISeatedEvent extends IBaseEvent {
  eventType: 'SEATED';
  seatingChart: {
    rows: number;
    columns: number;
    sections: Array<ISection>;
    customLayout?: {
      seatMap: Array<{
        id: string;
        x: number;
        y: number;
        sectionId: string;
      }>;
    };
  };
}

export type IEvent = IGeneralEvent | ISeatedEvent;

// app/types/event.ts
export interface Section {
  id: string;
  name: string;
  type: 'REGULAR' | 'VIP' | 'DISABLED';
  price: number;
  rowStart: number;
  rowEnd: number;
  columnStart: number;
  columnEnd: number;
  color: string;
}

export interface SeatingChart {
  rows: number;
  columns: number;
  sections: Section[];
  customLayout?: boolean;
}

export interface Seat {
  id: any;
  _id: string;
  eventId: string;
  seatId: string;
  row: number;
  column: number;
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED';
  type: 'REGULAR' | 'VIP' | 'DISABLED';
  price: number;
  section: string;
  label: string;
  temporaryReservation?: {
    sessionId: string;
    expiresAt: Date;
  };
  lastReservationAttempt?: Date;
}