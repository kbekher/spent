import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Expense, ExpenseStats } from '../../types';
import * as api from '../../services/api';

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
  }: {
    userId: string;
    amount: number;
    categoryId: string;
    date?: Date;
    description?: string;
  }) => {
    return await api.createExpense(userId, amount, categoryId, date, description);
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
      // Add expense
      .addCase(addExpense.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      // Remove expense
      .addCase(removeExpense.fulfilled, (state, action) => {
        state.items = state.items.filter((exp) => exp._id !== action.payload);
      });
  },
});

export const { clearExpenses } = expensesSlice.actions;
export default expensesSlice.reducer;
