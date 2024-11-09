// models/Seat.ts
import mongoose, { Model } from 'mongoose';

export interface ISeat {
  eventId: mongoose.Types.ObjectId;
  row: number;
  column: number;
  number: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  price: number;
  seatId: string;
  type: 'REGULAR' | 'VIP' | 'DISABLED';
  ticketId?: mongoose.Types.ObjectId;
  reservationExpires?: Date;
}

interface ISeatModel extends Model<ISeat> {
  releaseExpiredSeats(eventId: string): Promise<mongoose.UpdateWriteOpResult>;
}

const SeatSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  number: {
    type: String,
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
  status: {
    type: String,
    enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED'],
    default: 'AVAILABLE'
  },
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  },
  type: {
    type: String,
    enum: ['REGULAR', 'VIP', 'DISABLED'],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  reservationExpires: {
    type: Date,
    index: { expires: 0 } // TTL index para expiración automática
  }
}, {
  timestamps: true
});

// Índices para optimización
SeatSchema.index({ eventId: 1, number: 1 }, { unique: true });
SeatSchema.index({ eventId: 1, status: 1 });
SeatSchema.index({ ticketId: 1 });
SeatSchema.index({ reservationExpires: 1 }, { expireAfterSeconds: 900 }); // 15 minutos

SeatSchema.statics.releaseExpiredSeats = async function(eventId: string) {
  const result = await this.updateMany(
    {
      eventId,
      status: 'RESERVED',
      reservationExpires: { $lt: new Date() }
    },
    {
      $set: { status: 'AVAILABLE' },
      $unset: { ticketId: 1, reservationExpires: 1 }
    }
  );

  console.log('Released expired seats:', {
    eventId,
    releasedCount: result.modifiedCount,
    timestamp: new Date()
  });

  return result;
};

// Exportar con el tipo correcto
const Seat = (mongoose.models.Seat || mongoose.model<ISeat, ISeatModel>('Seat', SeatSchema)) as ISeatModel;

export { Seat };