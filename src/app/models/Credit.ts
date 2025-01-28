// models/Credit.ts
import mongoose from 'mongoose';

const CreditPackageSchema = new mongoose.Schema({
  name: String,
  credits: Number,
  price: Number,
  imageUrl: {
    type: String,
    default: '/credits/off-creditos.png'
  }, // Añadimos este campo
  isActive: {
    type: Boolean,
    default: true
  }
});

const CreditTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['PURCHASE', 'USE', 'REFUND'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    optional: true
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreditPackage',
    optional: true
  },
  paymentId: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const CreditSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0
  },
  transactions: [CreditTransactionSchema]
});

export const Credit = mongoose.models.Credit || mongoose.model('Credit', CreditSchema);
export const CreditPackage = mongoose.models.CreditPackage || mongoose.model('CreditPackage', CreditPackageSchema);