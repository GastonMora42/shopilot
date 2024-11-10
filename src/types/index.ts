// types/index.ts
import { ObjectId, Document } from 'mongoose';

// Status como union types
export type TicketStatus = 'PENDING' | 'PAID' | 'FAILED' | 'USED' | 'CANCELLED';
export type SeatStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
export type SeatType = 'REGULAR' | 'VIP' | 'DISABLED';
export type PaymentStatus = 'approved' | 'rejected' | 'cancelled' | 'pending';

// Interfaces base
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
  reservationExpires?: Date;  // Agregado
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
  // Métodos agregados del modelo
  markAsPaid(paymentId: string): Promise<ITicket>;
  markAsFailed(paymentId: string): Promise<ITicket>;
}

// Interfaces para MercadoPago
export interface MercadoPagoWebhook {
  action: string;
  api_version: string;
  data: {
    id: string;
  };
  date_created: string;
  id: string;
  live_mode: boolean;
  type: 'payment' | 'plan' | 'subscription' | 'invoice';
  user_id: string;
}

export interface MercadoPagoPayment {
  id: number | string;
  status: PaymentStatus;
  status_detail: string;
  external_reference: string;
  date_approved?: string;
  date_created: string;
  transaction_amount: number;
  payment_method_id: string;
}

// Interfaces para requests
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
  seats?: string[];
}

// Interfaces para responses
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
    paymentId?: string;  // Agregado
  };
  error?: string;
}

export interface WebhookResponse {
  success: boolean;
  message?: string;
  data?: {
    ticketId: string;
    paymentId: string;
    status: PaymentStatus;
  };
  error?: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  status?: TicketStatus;
  paymentId?: string;
  error?: string;
}

// Interfaces para emails
export interface TicketEmailData {
  ticket: {
    eventName: string;
    date: Date;
    location: string;
    seats: string[];
  };
  qrCode: string;
  email: string;
}

// Utility types
export type ValidationError = {
  field: string;
  message: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string | ValidationError[];
};