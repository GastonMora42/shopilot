// types/index.ts
import { ObjectId, Document, Types } from 'mongoose';

// Status como union types - sin cambios
export type TicketStatus = 'PENDING' | 'PAID' | 'FAILED' | 'USED' | 'CANCELLED';
export type SeatStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
export type SeatType = 'REGULAR' | 'VIP' | 'DISABLED';
export type PaymentStatus = 'approved' | 'rejected' | 'cancelled' | 'pending';

// Interfaces base
export interface IEvent extends Document {
  _id: Types.ObjectId;  // Cambiado a Types.ObjectId
  name: string;
  slug: string;
  description: string;
  date: Date;
  location: string;
  published: boolean;
  organizerId: Types.ObjectId;  // Cambiado a Types.ObjectId
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
  calculateTotal(seats: string[]): number;  // Agregar método
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
  _id: Types.ObjectId;
  eventId: Types.ObjectId;
  row: number;
  column: number;
  number: string;
  status: SeatStatus;
  price: number;
  type: SeatType;
  ticketId?: Types.ObjectId;
  reservationExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITicket extends Document {
  _id: Types.ObjectId;
  eventId: Types.ObjectId;
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
  ticketId: string;  // Cambiado de _id a ticketId
  eventName: string;
  price: number;
  description: string;
  seats: string[];  // Hecho requerido
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
      dni: string;  // Agregado dni
      phone?: string;  // Agregado phone opcional
    };
    price: number;
    paymentId?: string;
  };
  preferenceId?: string;  // Agregado
  checkoutUrl?: string;   // Agregado
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

export type MongoId = string | Types.ObjectId;

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
}

export interface FilterParams {
  status?: TicketStatus;
  dateFrom?: Date;
  dateTo?: Date;
  [key: string]: any;
}