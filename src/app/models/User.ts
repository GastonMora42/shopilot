// src/models/User.ts
import mongoose from 'mongoose';

export interface IUser {
  name: string;
  email: string;
  password: string;
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
  mercadopago: {
    accessToken: String,
    refreshToken: String,
    userId: String,
    publicKey: String
  }
}, {
  timestamps: true
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);