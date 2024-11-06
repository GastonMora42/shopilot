// models/Ticket.ts
import mongoose from "mongoose";

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

export const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);