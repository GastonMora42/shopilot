// models/Ticket.ts
import mongoose, { Document } from "mongoose";

export interface ITicket extends Document {
  eventId: mongoose.Types.ObjectId;
  seats: string[];
  buyerInfo: {
    name: string;
    email: string;
    dni: string;
    phone?: string;
  };
  qrCode: string;
  status: 'PENDING' | 'PAID' | 'USED' | 'CANCELLED';
  price: number;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  seats: [{
    type: String,
    required: true
  }],
  buyerInfo: {
    name: String,
    email: {
      type: String,
      required: true
    },
    dni: String,
    phone: String
  },
  qrCode: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'USED', 'CANCELLED'],
    default: 'PENDING'
  },
  price: {
    type: Number,
    required: true
  },
  paymentId: String
}, {
  timestamps: true
});

export const Ticket = mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);