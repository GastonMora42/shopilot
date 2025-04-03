// models/TransferTicket.ts
import mongoose from "mongoose";

const TransferTicketSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  buyerInfo: {
    name: String,
    email: String,
    dni: String,
    phone: String
  },
  eventType: {
    type: String,
    enum: ['SEATED', 'GENERAL']
  },
  seats: [String],
  ticketType: {
    name: String,
    price: Number
  },
  quantity: Number,
  price: Number,
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  transferProof: {
    imageUrl: String,
    notes: String,
    uploadedAt: Date
  },
  rejectionReason: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const TransferTicket = mongoose.models.TransferTicket || 
  mongoose.model('TransferTicket', TransferTicketSchema);