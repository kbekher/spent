import mongoose, { Schema } from 'mongoose';
import { ICategory } from '../types/index.js';

const categorySchema = new Schema<ICategory>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      default: '#3b82f6',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for userId and name to ensure unique category names per user
categorySchema.index({ userId: 1, name: 1 }, { unique: true });

export const Category = mongoose.model<ICategory>('Category', categorySchema);
