// src/models/User.ts
import mongoose from 'mongoose';

export interface IUser {
  name: string;
  email: string;
  password: string;
  credits?: mongoose.Types.ObjectId; // Añadimos credits a la interfaz
  mercadopago?: {
    accessToken?: string;
    refreshToken?: string;
    userId?: string;
    publicKey?: string;
  };
}

const UserSchema = new mongoose.Schema<IUser>({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  credits: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Credit',
    default: null
  },
  mercadopago: {
    accessToken: String,
    refreshToken: String,
    userId: String,
    publicKey: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Añadimos un virtual para facilitar el acceso al balance de créditos
UserSchema.virtual('creditBalance', {
  ref: 'Credit',
  localField: 'credits',
  foreignField: '_id',
  justOne: true,
  get: function(credit: any) {
    return credit?.balance || 0;
  }
});

// Middleware para crear automáticamente un registro de créditos al crear un usuario
UserSchema.pre('save', async function(next) {
  if (this.isNew && !this.credits) {
    const Credit = mongoose.model('Credit');
    const userCredits = await Credit.create({
      userId: this._id,
      balance: 0,
      transactions: []
    });
    this.credits = userCredits._id;
  }
  next();
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);