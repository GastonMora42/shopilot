// types/index.ts
import { ObjectId, Document } from 'mongoose';

// Status como types para reutilización
export type TicketStatus = 'PENDING' | 'PAID' | 'USED' | 'CANCELLED';
export type SeatStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
export type SeatType = 'REGULAR' | 'VIP' | 'DISABLED';

export interface IEvent extends Document {
  _id: string;
  name: string;
  slug: string;
  description: string;
  date: Date;
  location: string;
  published: boolean;
  organizerId: string;
  image?: string;
  mercadopago: {
    accessToken: string;
    userId: string;
  };
  seatingChart: {
    rows: number;
    columns: number;
    sections: Array<ISection>;
  };
  createdAt: Date;
  updatedAt: Date;
}

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