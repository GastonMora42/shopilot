// models/Ticket.ts
import mongoose, { Document } from "mongoose";

interface QRTicket {
  qrCode: string;
  qrValidation: string;
  qrMetadata: {
    timestamp: number;
    ticketId: string;
    subTicketId: string;
    type: 'SEATED' | 'GENERAL';
    status: 'PENDING' | 'PAID' | 'USED' | 'CANCELLED';
    seatInfo?: {
      seat: string;
    };
    generalInfo?: {
      ticketType: string;
      index: number;
    };
  };
}

interface BaseTicketDocument extends Document {
  eventId: {
    name: string;
    date: string;
    location: string;
  };
  userId: mongoose.Types.ObjectId;
  qrTickets: QRTicket[];
  status: 'PENDING' | 'PAID' | 'USED' | 'CANCELLED';
  paymentMethod: 'MERCADOPAGO' | 'BANK_TRANSFER';
  buyerInfo: {
    name: string;
    email: string;
    dni: string;
    phone?: string;
  };
  price: number;
  paymentId?: string;
  transferProof?: {
    imageUrl: string;
    notes?: string;
    uploadedAt: Date;
  };
  rejectionReason?: string;
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
  qrTickets: [{
    qrCode: {
      type: String,
      required: true
    },
    qrValidation: {
      type: String,
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
      subTicketId: {
        type: String,
        required: true,
        unique: true
      },
      type: {
        type: String,
        enum: ['SEATED', 'GENERAL'],
        required: true
      },
      status: {
        type: String,
        enum: ['PENDING', 'PAID', 'USED', 'CANCELLED'],
        default: 'PENDING'
      },
      seatInfo: {
        seat: String
      },
      generalInfo: {
        ticketType: String,
        index: Number
      },
    }
  }],
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'USED', 'CANCELLED'],
    default: 'PENDING'
  },
  paymentMethod: {
    type: String,
    enum: ['MERCADOPAGO', 'BANK_TRANSFER'],
    default: 'MERCADOPAGO'
  },
  paymentId: String,
  price: {
    type: Number,
    required: true
  },
  // ¡IMPORTANTE! Estos campos estaban definidos incorrectamente fuera del esquema principal
  transferProof: {
    imageUrl: String,
    notes: String,
    uploadedAt: Date
  },
  rejectionReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
TicketSchema.index({ eventId: 1, status: 1 });
TicketSchema.index({ userId: 1 });
TicketSchema.index({ 'buyerInfo.email': 1 });
TicketSchema.index({ paymentId: 1 });
TicketSchema.index({ 'qrTickets.qrMetadata.subTicketId': 1 }, { unique: true });
TicketSchema.index({ 'qrTickets.qrCode': 1 }, { unique: true });
TicketSchema.index({ 'qrTickets.qrValidation': 1 }, { unique: true });
TicketSchema.index({ paymentMethod: 1, status: 1 }); // Nuevo índice para buscar tickets por método de pago

// Middleware de validación
TicketSchema.pre('validate', function(next) {
  if (this.eventType === 'SEATED' && (!this.seats || this.seats.length === 0)) {
    next(new Error('Los asientos son requeridos para eventos con asientos'));
  }

  if (this.eventType === 'GENERAL' && (!this.ticketType || !this.quantity)) {
    next(new Error('El tipo de ticket y cantidad son requeridos para eventos generales'));
  }

  // Validación adicional para pagos por transferencia
  if (this.paymentMethod === 'BANK_TRANSFER' && this.status === 'PENDING' && (!this.transferProof || !this.transferProof.imageUrl)) {
    next(new Error('El comprobante de transferencia es obligatorio para pagos por transferencia'));
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