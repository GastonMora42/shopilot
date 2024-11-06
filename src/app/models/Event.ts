// models/Event.ts
import mongoose from 'mongoose';
import { IEvent } from '@/types';
import slugify from 'slugify';

const EventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true
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

// Generar slug antes de guardar
EventSchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    let baseSlug = slugify(this.name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;
    
    // Verificar si el slug existe y agregar contador si es necesario
    while (await mongoose.models.Event.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

export const Event = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);