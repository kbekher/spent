import mongoose, { Schema } from 'mongoose';
import { IRecurringPayment } from '../types/index.js';

const recurringPaymentSchema = new Schema<IRecurringPayment>(
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
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    categoryId: {
      type: String,
      required: true,
    },
    startDay: {
      type: Number,
      default: 1,
      min: 1,
      max: 31,
    },
    frequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
      default: 'monthly',
    },
    startMonth: {
      type: Number,
      min: 1,
      max: 12,
    },
    excludedMonths: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const RecurringPayment = mongoose.model<IRecurringPayment>(
  'RecurringPayment',
  recurringPaymentSchema
);
