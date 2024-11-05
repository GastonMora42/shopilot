// types/index.ts
import { ObjectId } from 'mongoose';

export interface IEvent {
  _id: ObjectId;
  organizerId: ObjectId;
  name: string;
  description: string;
  date: Date;
  location: string;
  published: boolean;
  mercadopago: {
    accessToken: string;
    userId: string;
  };
  seatingChart: {
    rows: number;
    columns: number;
    sections: ISection[];
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