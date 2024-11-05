import mongoose from "mongoose";

// models/Ticket.ts
const TicketSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  seatNumber: {
    type: String,
    required: true
  },
  buyerInfo: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    dni: {
      type: String,
      required: true
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
    enum: ['PENDING', 'PAID', 'USED'],
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

export const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);