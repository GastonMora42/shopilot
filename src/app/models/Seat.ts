// models/Seat.ts
import mongoose, { Model } from 'mongoose';

export interface ISeat {
  eventId: mongoose.Types.ObjectId;
  seatId: string;
  row: number;
  column: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  type: 'REGULAR' | 'VIP' | 'DISABLED';
  price: number;
  section: string;
  label: string;
  updatedAt: Date;
  ticketId?: mongoose.Types.ObjectId;
  temporaryReservation?: {
    sessionId: string;
    expiresAt: Date;
  };
  lastReservationAttempt?: Date;
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
  seatId: {
    type: String,
    required: true
  },
  section: {
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
  type: {
    type: String,
    enum: ['REGULAR', 'VIP', 'DISABLED'],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  },
  temporaryReservation: {
    sessionId: String,
    expiresAt: {
      type: Date,
      index: { expires: 600 }
    }
  },
  lastReservationAttempt: Date
}, {
  timestamps: true
});

SeatSchema.index({ eventId: 1, seatId: 1 }, { unique: true });
SeatSchema.index({ eventId: 1, status: 1 });
SeatSchema.index({ ticketId: 1 });
SeatSchema.index({ 'temporaryReservation.expiresAt': 1 }, { expireAfterSeconds: 600 });

SeatSchema.statics.releaseExpiredSeats = async function(eventId: string) {
  const result = await this.updateMany(
    {
      eventId,
      status: 'RESERVED',
      'temporaryReservation.expiresAt': { $lt: new Date() }
    },
    {
      $set: { status: 'AVAILABLE' },
      $unset: { 
        ticketId: 1,
        temporaryReservation: 1,
        lastReservationAttempt: 1
      }
    }
  );

  console.log('Released expired seats:', {
    eventId,
    releasedCount: result.modifiedCount,
    timestamp: new Date()
  });

  return result;
};

SeatSchema.pre('save', function(next) {
  if (!this.seatId) {
    const rowLetter = String.fromCharCode(65 + this.row);
    const colNumber = (this.column + 1).toString().padStart(2, '0');
    this.seatId = `${rowLetter}${colNumber}`;
  }
  if (!this.label) {
    this.label = this.seatId;
  }
  next();
});

const Seat = (mongoose.models.Seat || mongoose.model<ISeat, ISeatModel>('Seat', SeatSchema)) as ISeatModel;

export { Seat };