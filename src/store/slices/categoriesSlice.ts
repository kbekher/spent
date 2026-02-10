import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Category } from '../../types';
import * as api from '../../services/api';

interface CategoriesState {
  items: Category[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoriesState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchCategories = createAsyncThunk(
  'categories/fetchAll',
  async (userId: string) => {
    return await api.getCategories(userId);
  }
);

export const addCategory = createAsyncThunk(
  'categories/add',
  async ({ userId, name, color }: { userId: string; name: string; color: string }) => {
    return await api.createCategory(userId, name, color);
  }
);

export const editCategory = createAsyncThunk(
  'categories/edit',
  async ({ id, name, color }: { id: string; name: string; color: string }) => {
    return await api.updateCategory(id, name, color);
  }
);

export const removeCategory = createAsyncThunk(
  'categories/remove',
  async (id: string) => {
    await api.deleteCategory(id);
    return id;
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearCategories: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch categories';
      })
      // Add
      .addCase(addCategory.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      // Edit
      .addCase(editCategory.fulfilled, (state, action) => {
        const index = state.items.findIndex((cat) => cat._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      // Remove
      .addCase(removeCategory.fulfilled, (state, action) => {
        state.items = state.items.filter((cat) => cat._id !== action.payload);
      });
  },
});

export const { clearCategories } = categoriesSlice.actions;
export default categoriesSlice.reducer;
