// models/Ticket.ts
import mongoose, { Document } from "mongoose";
import { TicketStatus } from '@/types';

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
  status: TicketStatus;
  price: number;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
  markAsPaid(paymentId: string): Promise<ITicket>;
  markAsFailed(paymentId: string): Promise<ITicket>;
}

const TicketSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  seats: [{
    type: String,
    required: true
  }],
  buyerInfo: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    dni: {
      type: String,
      required: true,
      trim: true
    },
    phone: String
  },
  qrCode: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED', 'USED', 'CANCELLED'],
    default: 'PENDING',
    index: true
  },
  paymentId: {
    type: String,
    sparse: true,
    index: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Métodos de instancia
TicketSchema.methods.markAsPaid = async function(paymentId: string) {
  this.status = 'PAID';
  this.paymentId = paymentId;
  return await this.save();
};

TicketSchema.methods.markAsFailed = async function(paymentId: string) {
  this.status = 'FAILED';
  this.paymentId = paymentId;
  return await this.save();
};

// Índices
TicketSchema.index({ eventId: 1, status: 1 });
TicketSchema.index({ qrCode: 1 }, { unique: true });
TicketSchema.index({ paymentId: 1 }, { sparse: true });

export const Ticket = mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);