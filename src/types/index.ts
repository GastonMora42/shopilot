// types/index.ts
import { ObjectId } from 'mongoose';

// types/index.tsss
export interface IEvent {
  _id: string;
  name: string;
  slug: string;
  description: string;
  date: Date;
  location: string;
  published: boolean;
  organizerId: string;
  mercadopago: {
    accessToken: string;
    userId: string;
  };
  seatingChart: {
    rows: number;
    columns: number;
    sections: Array<{
      name: string;
      type: 'REGULAR' | 'VIP' | 'DISABLED';
      price: number;
      rowStart: number;
      rowEnd: number;
      columnStart: number;
      columnEnd: number;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ISection {
  name: string;
  type: 'REGULAR' | 'VIP' | 'DISABLED';
  price: number;
  rowStart: number;
  rowEnd: number;
  columnStart: number;
  columnEnd: number;
}

export interface ISeat {
  _id: ObjectId;
  eventId: ObjectId;
  row: number;
  column: number;
  number: string;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
  price: number;
  type: 'REGULAR' | 'VIP' | 'DISABLED';
  createdAt: Date;
  updatedAt: Date;
}

export interface ITicket {
  _id: ObjectId;
  eventId: ObjectId;
  seatNumber: string;
  buyerInfo: {
    name: string;
    email: string;
    dni: string;
    phone?: string;
  };
  qrCode: string;
  status: 'PENDING' | 'PAID' | 'USED';
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
    status: string;
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