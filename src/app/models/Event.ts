// models/Event.ts
import { IEvent } from '@/types/event';
import mongoose from 'mongoose';
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
    columnEnd: Number,
    color: String
  }],
  customLayout: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// Esquema para datos bancarios sin validaciones complejas
const BankAccountDataSchema = new mongoose.Schema({
  accountName: String,
  cbu: String,
  bank: String,
  additionalNotes: String
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
  endDate: {
    type: Date,
    validate: {
      validator: function(this: any) {
        return !this.endDate || this.endDate > this.date;
      },
      message: 'La fecha de finalización debe ser posterior a la fecha de inicio'
    }
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
  paymentMethod: {
    type: String,
    enum: ['MERCADOPAGO', 'BANK_TRANSFER'],
    default: 'MERCADOPAGO'
  },
  // Datos de MercadoPago - esquema simple
  mercadopago: {
    accessToken: String,
    userId: String
  },
  // Datos bancarios
  bankAccountData: BankAccountDataSchema,
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
    enum: ['DRAFT', 'PUBLISHED', 'FINISHED', 'CANCELLED'],
    default: 'DRAFT'
  },
  maxTicketsPerPurchase: {
    type: Number,
    default: 10
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
EventSchema.index({ endDate: 1 }); // Nuevo índice para consultas por fecha de finalización

// Validador pre-save para validaciones cruzadas basadas en paymentMethod
EventSchema.pre('validate', function(next) {
  // Si el método de pago es MercadoPago, verificar datos requeridos
  if (this.paymentMethod === 'MERCADOPAGO') {
    if (!this.mercadopago || !this.mercadopago.accessToken || !this.mercadopago.userId) {
      this.invalidate('mercadopago', 
        'Los datos de MercadoPago son requeridos para eventos con pago por MercadoPago');
    }
  }
  
  // Si el método es transferencia bancaria, verificar datos requeridos
  if (this.paymentMethod === 'BANK_TRANSFER') {
    if (!this.bankAccountData || !this.bankAccountData.accountName || 
        !this.bankAccountData.cbu || !this.bankAccountData.bank) {
      this.invalidate('bankAccountData',
        'Los datos bancarios son requeridos para eventos con pago por transferencia');
    }
  }

  // Si no hay fecha de finalización, establecerla automáticamente 24 horas después
  if (this.date && !this.endDate) {
    const endDate = new Date(this.date);
    endDate.setHours(endDate.getHours() + 24);
    this.endDate = endDate;
  }
  
  next();
});

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

EventSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.published && this.status === 'PUBLISHED' && 
    (this.endDate ? now <= this.endDate : now <= this.date);
});

EventSchema.virtual('hasStarted').get(function() {
  return new Date() >= this.date;
});

EventSchema.virtual('hasEnded').get(function() {
  return this.endDate ? new Date() > this.endDate : new Date() > this.date;
});

EventSchema.virtual('duration').get(function() {
  if (!this.endDate) return 24; // Default 24 hours
  const start = new Date(this.date);
  const end = new Date(this.endDate);
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // Duration in hours
});

export const Event = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);