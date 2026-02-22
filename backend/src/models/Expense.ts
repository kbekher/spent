import mongoose, { Schema } from 'mongoose';
import { IExpense } from '../types/index.js';

const expenseSchema = new Schema<IExpense>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    categoryId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
    },
    recurringTemplateId: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, categoryId: 1 });

export const Expense = mongoose.model<IExpense>('Expense', expenseSchema);
