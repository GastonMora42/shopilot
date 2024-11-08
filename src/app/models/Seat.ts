// models/Seat.ts
import mongoose from 'mongoose';

export interface ISeat {
  eventId: mongoose.Types.ObjectId;
  row: number;
  column: number;
  number: string; // Ejemplo: "A1", "B2", etc.
  status: 'available' | 'occupied' | 'reserved';
  price: number;
  seatId: string;
  type?: 'REGULAR' | 'VIP' | 'DISABLED';
}

const SeatSchema = new mongoose.Schema<ISeat>({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Event'
  },
  seatId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved'],
    default: 'available'
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

SeatSchema.index({ eventId: 1, status: 1 });
SeatSchema.index({ eventId: 1, row: 1, column: 1 });
SeatSchema.index({ eventId: 1, seatId: 1 }, { unique: true });

export const Seat = mongoose.models.Seat || mongoose.model('Seat', SeatSchema);