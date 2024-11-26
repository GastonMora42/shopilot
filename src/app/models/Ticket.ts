// models/Ticket.ts
import mongoose, { Document } from "mongoose";

export interface ITicket extends Document {
  eventId: mongoose.Types.ObjectId;
  eventType: 'SEATED' | 'GENERAL';
  seats?: string[];
  ticketType?: {
    name: string;
    price: number;
  };
  quantity?: number;
  buyerInfo: {
    name: string;
    email: string;
    dni: string;
    phone?: string;
  };
  qrCode: string;
  status: 'PENDING' | 'PAID' | 'USED' | 'CANCELLED';
  price: number;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  eventType: {
    type: String,
    enum: ['SEATED', 'GENERAL'],
    required: true
  },
  // Para eventos con asientos
  seats: {
    type: [{
      type: String,
      required: true
    }],
    validate: {
      validator: function(this: any) {
        return this.eventType !== 'SEATED' || (this.seats && this.seats.length > 0);
      },
      message: 'Los asientos son requeridos para eventos con asientos'
    }
  },
  // Para eventos generales
  ticketType: {
    type: {
      name: String,
      price: Number
    },
    validate: {
      validator: function(this: any) {
        return this.eventType !== 'GENERAL' || (this.ticketType && this.ticketType.name && this.ticketType.price);
      },
      message: 'El tipo de ticket es requerido para eventos generales'
    }
  },
  quantity: {
    type: Number,
    validate: {
      validator: function(this: any) {
        return this.eventType !== 'GENERAL' || (this.quantity && this.quantity > 0);
      },
      message: 'La cantidad es requerida para eventos generales'
    }
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
    enum: ['PENDING', 'PAID', 'USED', 'CANCELLED'],
    default: 'PENDING'
  },
  paymentId: String,
  price: {
    type: Number,
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
TicketSchema.index({ eventId: 1, status: 1 });
TicketSchema.index({ qrCode: 1 }, { unique: true });
TicketSchema.index({ 'buyerInfo.email': 1 });
TicketSchema.index({ paymentId: 1 });

// Middleware de validación
TicketSchema.pre('validate', function(next) {
  if (this.eventType === 'SEATED' && (!this.seats || this.seats.length === 0)) {
    next(new Error('Los asientos son requeridos para eventos con asientos'));
  } else if (this.eventType === 'GENERAL' && (!this.ticketType || !this.quantity)) {
    next(new Error('El tipo de ticket y cantidad son requeridos para eventos generales'));
  } else {
    next();
  }
});

// Virtuals
TicketSchema.virtual('totalPrice').get(function() {
  if (this.eventType === 'GENERAL') {
    return (this.ticketType?.price || 0) * (this.quantity || 0);
  }
  return this.price;
});

export const Ticket = mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);