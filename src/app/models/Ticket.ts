// models/Ticket.ts
import mongoose, { Document } from "mongoose";

export interface ITicket extends Document {
  eventId: mongoose.Types.ObjectId;
  seats: string
  buyerInfo: {
    name: string;
    email: string;
    dni: string;
    phone?: string;
  };
  qrCode: string;
  status: 'PENDING' | 'PAID' | 'USED' | 'CANCELLED' ;
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
  paymentId: String,
  price: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Índices importantes
TicketSchema.index({ eventId: 1, status: 1 });
TicketSchema.index({ qrCode: 1 }, { unique: true });

export const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);