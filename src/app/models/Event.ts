// models/Event.ts
import mongoose from 'mongoose';
import { IEvent } from '@/types';

const EventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  totalSeats: {
    type: Number,
    required: true,
    min: 1
  },
  availableSeats: {
    type: Number,
    required: true
  },
  slug: {
    type: String,
    unique: true
  },
  published: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,

  seatingChart: {
    rows: { type: Number, required: true },
    columns: { type: Number, required: true },
    sections: [{
      name: String,
      type: {
        type: String,
        enum: ['REGULAR', 'VIP', 'DISABLED'],
        default: 'REGULAR'
      },
      price: Number,
      rowStart: Number,
      rowEnd: Number,
      columnStart: Number,
      columnEnd: Number
    }]
  }
});


export const Event = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);