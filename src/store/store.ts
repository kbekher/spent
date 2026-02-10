import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import categoriesReducer from './slices/categoriesSlice';
import expensesReducer from './slices/expensesSlice';
import recurringPaymentsReducer from './slices/recurringPaymentsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    categories: categoriesReducer,
    expenses: expensesReducer,
    recurringPayments: recurringPaymentsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
