import axios from 'axios';
import { storage } from '../utils/storage';
import { apiConfig } from '../config/auth0';

const api = axios.create({
  baseURL: apiConfig.baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await storage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// User API
export const syncUser = async (email: string, username: string) => {
  const response = await api.post('/users/sync', { email, username });
  return response.data;
};

export const getUser = async (userId: string) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

export const getUserSettings = async (userId: string) => {
  const response = await api.get(`/users/${userId}/settings`);
  return response.data;
};

export const updateUserSettings = async (
  userId: string,
  settings: { displayName: string; currency: string }
) => {
  const response = await api.put(`/users/${userId}/settings`, settings);
  return response.data;
};

// Category API
export const getCategories = async (userId: string) => {
  const response = await api.get(`/categories/user/${userId}`);
  return response.data;
};

export const createCategory = async (
  userId: string,
  name: string,
  color: string = '#3b82f6'
) => {
  const response = await api.post('/categories', { userId, name, color });
  return response.data;
};

export const updateCategory = async (id: string, name: string, color: string) => {
  const response = await api.put(`/categories/${id}`, { name, color });
  return response.data;
};

export const deleteCategory = async (id: string) => {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
};

// Expense API
export const getExpenses = async (
  userId: string,
  startDate?: string,
  endDate?: string,
  categoryId?: string
) => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (categoryId) params.categoryId = categoryId;

  const response = await api.get(`/expenses/user/${userId}`, { params });
  return response.data;
};

export const getExpenseStats = async (userId: string, year?: number, month?: number) => {
  const params: any = {};
  if (year) params.year = year;
  if (month) params.month = month;

  const response = await api.get(`/expenses/stats/user/${userId}`, { params });
  return response.data;
};

export const createExpense = async (
  userId: string,
  amount: number,
  categoryId: string,
  date?: Date,
  description?: string
) => {
  const response = await api.post('/expenses', {
    userId,
    amount,
    categoryId,
    date: date?.toISOString(),
    description,
  });
  return response.data;
};

export const updateExpense = async (
  id: string,
  data: { amount?: number; categoryId?: string; description?: string; date?: Date }
) => {
  const response = await api.put(`/expenses/${id}`, data);
  return response.data;
};

export const deleteExpense = async (id: string) => {
  const response = await api.delete(`/expenses/${id}`);
  return response.data;
};

// Recurring Payment API
export const getRecurringPayments = async (userId: string) => {
  const response = await api.get(`/recurring-payments/user/${userId}`);
  return response.data;
};

export const createRecurringPayment = async (
  userId: string,
  name: string,
  amount: number,
  categoryId: string,
  dayOfMonth: number,
  frequency?: 'monthly' | 'quarterly' | 'yearly',
  startMonth?: number,
  excludedMonths?: string[]
) => {
  const response = await api.post('/recurring-payments', {
    userId,
    name,
    amount,
    categoryId,
    dayOfMonth,
    frequency: frequency || 'monthly',
    startMonth,
    excludedMonths: excludedMonths || [],
  });
  return response.data;
};

export const updateRecurringPayment = async (
  id: string,
  name: string,
  amount: number,
  categoryId: string,
  dayOfMonth: number,
  frequency: 'monthly' | 'quarterly' | 'yearly',
  startMonth: number | undefined,
  excludedMonths: string[],
  isActive: boolean
) => {
  const response = await api.put(`/recurring-payments/${id}`, {
    name,
    amount,
    categoryId,
    dayOfMonth,
    frequency,
    startMonth,
    excludedMonths,
    isActive,
  });
  return response.data;
};

export const toggleExcludeMonth = async (id: string, month: string) => {
  const response = await api.post(`/recurring-payments/${id}/toggle-exclude`, { month });
  return response.data;
};

export const deleteRecurringPayment = async (id: string) => {
  const response = await api.delete(`/recurring-payments/${id}`);
  return response.data;
};
