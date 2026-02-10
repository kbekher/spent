export interface User {
  _id: string;
  auth0Id: string;
  username: string;
  email: string;
  displayName?: string;
  currency: string;
  createdAt: string;
}

export interface Category {
  _id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Expense {
  _id: string;
  userId: string;
  amount: number;
  categoryId: string;
  date: string;
  description?: string;
  createdAt: string;
}

export interface RecurringPayment {
  _id: string;
  userId: string;
  name: string;
  amount: number;
  categoryId: string;
  dayOfMonth: number;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  startMonth?: number;
  excludedMonths: string[];
  isActive: boolean;
  createdAt: string;
}

export interface ExpenseStats {
  total: number;
  byCategory: Array<{
    name: string;
    color: string;
    total: number;
  }>;
  expenses: Expense[];
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
}
