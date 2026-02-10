import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types/index.js';

const userSchema = new Schema<IUser>(
  {
    auth0Id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    displayName: {
      type: String,
      trim: true,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', userSchema);
