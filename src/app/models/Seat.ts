// models/Seat.ts
import mongoose from 'mongoose';

export interface ISeat {
  eventId: mongoose.Types.ObjectId;
  row: number;
  column: number;
  number: string; // Ejemplo: "A1", "B2", etc.
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  price: number;
  seatId: string;
  type?: 'REGULAR' | 'VIP' | 'DISABLED';
  ticketId: object;
}

const SeatSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  number: {
    type: String,
    required: true
  },
  row: {
    type: Number,
    required: true
  },
  column: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED'],
    default: 'AVAILABLE'
  },
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  },
  type: {
    type: String,
    enum: ['REGULAR', 'VIP', 'DISABLED'],
    required: true
  },
  price: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Índices importantes
SeatSchema.index({ eventId: 1, number: 1 }, { unique: true });
SeatSchema.index({ eventId: 1, status: 1 });
SeatSchema.index({ ticketId: 1 });

export const Seat = mongoose.models.Seat || mongoose.model('Seat', SeatSchema);