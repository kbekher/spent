import { Document } from 'mongoose';

export interface IUser extends Document {
  auth0Id: string;
  email: string;
  username: string;
  displayName?: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory extends Document {
  userId: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExpense extends Document {
  userId: string;
  amount: number;
  categoryId: string;
  date: Date;
  description?: string;
  recurringTemplateId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRecurringPayment extends Document {
  userId: string;
  name: string;
  amount: number;
  categoryId: string;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  startDay: number;
  startMonth?: number;
  excludedMonths: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseStats {
  total: number;
  byCategory: Array<{
    name: string;
    color: string;
    total: number;
  }>;
  expenses: IExpense[];
}
