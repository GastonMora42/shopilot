// models/Seat.ts
import mongoose from 'mongoose';

export interface ISeat {
  eventId: mongoose.Types.ObjectId;
  row: number;
  column: number;
  number: string; // Ejemplo: "A1", "B2", etc.
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
  price: number;
  type?: 'REGULAR' | 'VIP' | 'DISABLED';
}

const SeatSchema = new mongoose.Schema<ISeat>({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
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
  number: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'RESERVED', 'SOLD'],
    default: 'AVAILABLE'
  },
  price: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['REGULAR', 'VIP', 'DISABLED'],
    default: 'REGULAR'
  }
}, {
  timestamps: true
});

export const Seat = mongoose.models.Seat || mongoose.model<ISeat>('Seat', SeatSchema);