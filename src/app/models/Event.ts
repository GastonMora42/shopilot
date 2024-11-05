// models/Event.ts
import mongoose from 'mongoose';
import { IEvent } from '@/types';

// models/Event.ts
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
  published: {
    type: Boolean,
    default: false
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mercadopago: {
    accessToken: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    }
  },
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
}, {
  timestamps: true
});

export const Event = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);