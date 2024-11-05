// types/index.ts
import { ObjectId } from 'mongoose';

export interface IEvent {
  _id: ObjectId;
  name: string;
  description: string;
  date: Date;
  location: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
  slug: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITicket {
  _id: ObjectId;
  eventId: ObjectId;
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