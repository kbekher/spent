import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Expense, ExpenseStats } from '../../types';
export type { Expense };
import * as api from '../../services/api';
import { getValidDayForMonth } from '../../utils/recurringUtils';

interface ExpensesState {
  items: Expense[];
  stats: ExpenseStats | null;
  loading: boolean;
  error: string | null;
}

const initialState: ExpensesState = {
  items: [],
  stats: null,
  loading: false,
  error: null,
};

export const fetchExpenses = createAsyncThunk(
  'expenses/fetchAll',
  async ({
    userId,
    startDate,
    endDate,
    categoryId,
  }: {
    userId: string;
    startDate?: string;
    endDate?: string;
    categoryId?: string;
  }) => {
    return await api.getExpenses(userId, startDate, endDate, categoryId);
  }
);

export const fetchExpenseStats = createAsyncThunk(
  'expenses/fetchStats',
  async ({ userId, year, month }: { userId: string; year?: number; month?: number }) => {
    return await api.getExpenseStats(userId, year, month);
  }
);

export const addExpense = createAsyncThunk(
  'expenses/add',
  async ({
    userId,
    amount,
    categoryId,
    date,
    description,
    recurringTemplateId,
  }: {
    userId: string;
    amount: number;
    categoryId: string;
    date?: Date;
    description?: string;
    recurringTemplateId?: string;
  }) => {
    return await api.createExpense(userId, amount, categoryId, date, description, recurringTemplateId);
  }
);

export const createExpenseFromRecurring = createAsyncThunk(
  'expenses/createFromRecurring',
  async ({
    recurringPayment,
    year,
    month,
  }: {
    recurringPayment: {
      _id: string;
      userId: string;
      amount: number;
      categoryId: string;
      name: string;
      startDay: number;
    };
    year: number;
    month: number;
  }) => {
    // Get valid day for the month (handles edge cases like Feb 30 -> Feb 28/29)
    const validDay = getValidDayForMonth(year, month, recurringPayment.startDay);
    const expenseDate = new Date(year, month - 1, validDay);
    return await api.createExpense(
      recurringPayment.userId,
      recurringPayment.amount,
      recurringPayment.categoryId,
      expenseDate,
      recurringPayment.name,
      recurringPayment._id
    );
  }
);

export const updateExpense = createAsyncThunk(
  'expenses/update',
  async ({
    id,
    amount,
    categoryId,
    description,
  }: {
    id: string;
    amount?: number;
    categoryId?: string;
    description?: string;
  }) => {
    return await api.updateExpense(id, { amount, categoryId, description });
  }
);

export const removeExpense = createAsyncThunk(
  'expenses/remove',
  async (id: string) => {
    await api.deleteExpense(id);
    return id;
  }
);

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    clearExpenses: (state) => {
      state.items = [];
      state.stats = null;
    },
    optimisticAddExpense: (state, action: PayloadAction<Expense>) => {
      state.items.unshift(action.payload);
    },
    optimisticDeleteExpense: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((exp) => exp._id !== action.payload);
    },
    optimisticUpdateExpense: (state, action: PayloadAction<Partial<Expense> & { _id: string }>) => {
      const idx = state.items.findIndex((exp) => exp._id === action.payload._id);
      if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload };
    },
    syncCategoryUpdate: (_state, _action: PayloadAction<{ _id: string; name: string; color: string }>) => {
      // Expenses reference categoryId by string; no local sync needed
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch expenses
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch expenses';
      })
      // Fetch stats
      .addCase(fetchExpenseStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      // Add expense — replace optimistic temp item if present, otherwise unshift
      .addCase(addExpense.fulfilled, (state, action) => {
        const tempIndex = state.items.findIndex((exp) => exp._id.startsWith('temp-'));
        if (tempIndex !== -1) {
          state.items[tempIndex] = action.payload;
        } else {
          state.items.unshift(action.payload);
        }
      })
      // Update expense
      .addCase(updateExpense.fulfilled, (state, action) => {
        const idx = state.items.findIndex((exp) => exp._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      // Remove expense
      .addCase(removeExpense.fulfilled, (state, action) => {
        state.items = state.items.filter((exp) => exp._id !== action.payload);
      });
  },
});

export const {
  clearExpenses,
  optimisticAddExpense,
  optimisticDeleteExpense,
  optimisticUpdateExpense,
  syncCategoryUpdate,
} = expensesSlice.actions;
export default expensesSlice.reducer;
