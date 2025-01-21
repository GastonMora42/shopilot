// models/Ticket.ts
import mongoose, { Document } from "mongoose";

// Interfaces base para documentos
interface BaseTicketDocument extends Document {
  eventId: {
    name: string;
    date: string;
    location: string;
  };
  userId: mongoose.Types.ObjectId;
  qrCode: string;
  qrValidation: string;
  qrMetadata: {
    timestamp: number;
    ticketId: string;
    type: 'SEATED' | 'GENERAL';
    seatInfo?: {
      seat: string;
    };
    generalInfo?: {
      ticketType: string;
      index: number;
    };
  };
  status: 'PENDING' | 'PAID' | 'USED' | 'CANCELLED';
  buyerInfo: {
    name: string;
    email: string;
    dni: string;
    phone?: string;
  };
  price: number;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SeatedTicketDocument extends BaseTicketDocument {
  eventType: 'SEATED';
  seats: string[];
}

interface GeneralTicketDocument extends BaseTicketDocument {
  eventType: 'GENERAL';
  ticketType: {
    name: string;
    price: number;
  };
  quantity: number;
}

export type ITicket = SeatedTicketDocument | GeneralTicketDocument;

const TicketSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventType: {
    type: String,
    enum: ['SEATED', 'GENERAL'],
    required: true
  },
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
      required: true,
      lowercase: true,
      trim: true
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
  qrValidation: {
    type: String,
    unique: true,
    required: true
  },
  qrMetadata: {
    timestamp: {
      type: Number,
      required: true
    },
    ticketId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['SEATED', 'GENERAL'],
      required: true
    },
    seatInfo: {
      seat: String
    },
    generalInfo: {
      ticketType: String,
      index: Number
    }
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
TicketSchema.index({ qrValidation: 1 }, { unique: true });
TicketSchema.index({ userId: 1 });
TicketSchema.index({ 'buyerInfo.email': 1 });
TicketSchema.index({ paymentId: 1 });
TicketSchema.index({ 'qrMetadata.ticketId': 1 });

// Middleware de validación
TicketSchema.pre('validate', function(next) {
  // Inicializar qrMetadata si no existe
  if (!this.qrMetadata) {
    this.qrMetadata = {
      timestamp: Date.now(),
      ticketId: this._id.toString(),
      type: this.eventType,
      seatInfo: undefined,
      generalInfo: undefined
    };
  }

  // Validación del tipo de evento y sus requisitos
  if (this.eventType === 'SEATED') {
    if (!this.seats || this.seats.length === 0) {
      next(new Error('Los asientos son requeridos para eventos con asientos'));
    }

    // Configurar qrMetadata para tickets con asientos
    this.qrMetadata = {
      ...this.qrMetadata,
      type: 'SEATED',
      seatInfo: { 
        seat: this.seats[0] // O puedes manejar múltiples asientos si es necesario
      },
      generalInfo: undefined // Limpiar info general si existía
    };

  } else if (this.eventType === 'GENERAL') {
    if (!this.ticketType || !this.quantity) {
      next(new Error('El tipo de ticket y cantidad son requeridos para eventos generales'));
    }

    // Configurar qrMetadata para tickets generales
    this.qrMetadata = {
      ...this.qrMetadata,
      type: 'GENERAL',
      seatInfo: undefined, // Limpiar info de asientos si existía
      generalInfo: {
        ticketType: this.ticketType?.name || '',
        index: 0 // Este índice podría ser útil si necesitas diferenciar múltiples tickets del mismo tipo
      }
    };
  }

  next();
});

// Virtuals
TicketSchema.virtual('totalPrice').get(function() {
  if (this.eventType === 'GENERAL') {
    return (this.ticketType?.price || 0) * (this.quantity || 0);
  }
  return this.price;
});

TicketSchema.virtual('isValid').get(function() {
  return this.status === 'PAID' && !['USED', 'CANCELLED'].includes(this.status);
});

// Método para validar QR
TicketSchema.methods.validateQR = function(qrCode: string): boolean {
  return this.qrCode === qrCode && this.status === 'PAID';
};

// Método para marcar como usado
TicketSchema.methods.markAsUsed = async function() {
  if (this.status !== 'PAID') {
    throw new Error('Solo tickets pagados pueden ser marcados como usados');
  }
  this.status = 'USED';
  await this.save();
};

export const Ticket = mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);