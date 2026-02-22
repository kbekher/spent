import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RecurringPayment } from '../../types';
import * as api from '../../services/api';

interface RecurringPaymentsState {
  items: RecurringPayment[];
  loading: boolean;
  error: string | null;
}

const initialState: RecurringPaymentsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchRecurringPayments = createAsyncThunk(
  'recurringPayments/fetchAll',
  async (userId: string) => {
    return await api.getRecurringPayments(userId);
  }
);

export const addRecurringPayment = createAsyncThunk(
  'recurringPayments/add',
  async ({
    userId,
    name,
    amount,
    categoryId,
    frequency,
    startDay,
    startMonth,
    excludedMonths,
  }: {
    userId: string;
    name: string;
    amount: number;
    categoryId: string;
    frequency?: 'monthly' | 'quarterly' | 'yearly';
    startDay?: number;
    startMonth?: number;
    excludedMonths?: string[];
  }) => {
    return await api.createRecurringPayment(
      userId,
      name,
      amount,
      categoryId,
      frequency,
      startDay,
      startMonth,
      excludedMonths
    );
  }
);

export const editRecurringPayment = createAsyncThunk(
  'recurringPayments/edit',
  async ({
    id,
    name,
    amount,
    categoryId,
    frequency,
    startDay,
    startMonth,
    excludedMonths,
    isActive,
  }: {
    id: string;
    name: string;
    amount: number;
    categoryId: string;
    frequency: 'monthly' | 'quarterly' | 'yearly';
    startDay: number;
    startMonth?: number;
    excludedMonths: string[];
    isActive: boolean;
  }) => {
    return await api.updateRecurringPayment(
      id,
      name,
      amount,
      categoryId,
      frequency,
      startDay,
      startMonth,
      excludedMonths,
      isActive
    );
  }
);

export const removeRecurringPayment = createAsyncThunk(
  'recurringPayments/remove',
  async (id: string) => {
    await api.deleteRecurringPayment(id);
    return id;
  }
);

const recurringPaymentsSlice = createSlice({
  name: 'recurringPayments',
  initialState,
  reducers: {
    clearRecurringPayments: (state) => {
      state.items = [];
    },
    syncCategoryUpdate: (_state, _action: PayloadAction<{ _id: string; name: string; color: string }>) => {
      // Recurring payments reference categoryId by string; no local sync needed
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchRecurringPayments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRecurringPayments.fulfilled, (state, action) => {
        state.loading = false;
        // Verify all payments have createdAt
        const payments = action.payload.map((p: RecurringPayment) => {
          if (!p.createdAt) {
            console.warn('Fetched recurring payment missing createdAt:', p._id);
          }
          return p;
        });
        console.log(`Fetched ${payments.length} recurring payments, all have createdAt:`, 
          payments.every(p => p.createdAt));
        state.items = payments;
      })
      .addCase(fetchRecurringPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch recurring payments';
      })
      // Add
      .addCase(addRecurringPayment.fulfilled, (state, action) => {
        // Ensure createdAt is present (should be set by backend timestamps)
        const payment = action.payload;
        if (!payment.createdAt) {
          console.warn('Recurring payment missing createdAt, adding current timestamp');
          payment.createdAt = new Date().toISOString();
        }
        console.log('Added recurring payment with createdAt:', payment.createdAt);
        state.items.unshift(payment);
      })
      // Edit
      .addCase(editRecurringPayment.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      // Remove
      .addCase(removeRecurringPayment.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item._id !== action.payload);
      });
  },
});

export const { clearRecurringPayments, syncCategoryUpdate } = recurringPaymentsSlice.actions;
export default recurringPaymentsSlice.reducer;
