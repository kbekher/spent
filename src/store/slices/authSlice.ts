import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { storage } from '../../utils/storage';
import { User, AuthState } from '../../types';
import { syncUser, updateUserSettings as apiUpdateUserSettings } from '../../services/api';


const initialState: AuthState = {
  user: null,
  accessToken: null,
  isLoading: true,
  error: null,
};

// Async thunks
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async () => {
    const token = await storage.getItem('accessToken');
    const userJson = await storage.getItem('user');

    if (token && userJson) {
      return {
        accessToken: token,
        user: JSON.parse(userJson) as User,
      };
    }

    return null;
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ accessToken, email, username }: { accessToken: string; email: string; username: string }) => {
    // Store token
    await storage.setItem('accessToken', accessToken);

    // Sync user with backend
    const user = await syncUser(email, username);

    // Store user data
    await storage.setItem('user', JSON.stringify(user));

    return { accessToken, user };
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    await storage.removeItem('accessToken');
    await storage.removeItem('user');
  }
);

export const updateUserSettings = createAsyncThunk(
  'auth/updateSettings',
  async ({ userId, displayName, currency }: { userId: string; displayName: string; currency: string }) => {
    const updated = await apiUpdateUserSettings(userId, { displayName, currency });
    await storage.setItem('user', JSON.stringify(updated));
    return updated;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize Auth
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.accessToken = action.payload.accessToken;
          state.user = action.payload.user;
        }
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to initialize auth';
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Login failed';
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.error = null;
      })
      .addCase(updateUserSettings.fulfilled, (state, action) => {
        if (state.user) {
          state.user = { ...state.user, ...action.payload };
        }
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
