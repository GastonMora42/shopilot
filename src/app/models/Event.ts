// models/Event.ts
import mongoose from 'mongoose';
import { IEvent } from '@/types';
import slugify from 'slugify';

const GeneralTicketSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  description: String
});

const SeatingChartSchema = new mongoose.Schema({
  rows: { type: Number },
  columns: { type: Number },
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
  }],
  customLayout: {
    type: Boolean,
    default: false
  }
}, { _id: false });

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
  imageUrl: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    required: true
  },
  eventType: {
    type: String,
    enum: ['SEATED', 'GENERAL'],
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
    type: SeatingChartSchema,
    validate: {
      validator: function(this: any) {
        return this.eventType !== 'SEATED' || 
          (this.seatingChart && 
           this.seatingChart.rows && 
           this.seatingChart.columns && 
           this.seatingChart.sections && 
           this.seatingChart.sections.length > 0);
      },
      message: 'SeatingChart es requerido para eventos con asientos'
    },
    required: false
  },
  generalTickets: {
    type: [GeneralTicketSchema],
    validate: {
      validator: function(this: any) {
        return this.eventType !== 'GENERAL' || 
          (this.generalTickets && this.generalTickets.length > 0);
      },
      message: 'Se requiere al menos un tipo de entrada para eventos generales'
    },
    required: false
  },
  status: {
    type: String,
    enum: ['DRAFT', 'PUBLISHED', 'CANCELLED'],
    default: 'DRAFT'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
EventSchema.index({ slug: 1 }, { unique: true });
EventSchema.index({ organizerId: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ date: 1 });

// Generación de slug
EventSchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    let baseSlug = slugify(this.name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;
    
    while (await mongoose.models.Event.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

// Virtuals
EventSchema.virtual('isSeated').get(function() {
  return this.eventType === 'SEATED';
});

EventSchema.virtual('isGeneral').get(function() {
  return this.eventType === 'GENERAL';
});

export const Event = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);