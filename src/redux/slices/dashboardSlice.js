import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { updateWalletBalance } from './authSlice';

// Async thunks
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (userId, { rejectWithValue }) => {
    try {
        const response = await api.getMessageStats(userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
    }
  }
);

export const fetchRecentOrders = createAsyncThunk(
  'dashboard/fetchRecentOrders',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.getrecentorders(userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch recent orders');
    }
  }
);

export const submitWalletRequest = createAsyncThunk(
  'dashboard/submitWalletRequest',
  async ({ amount, userId }, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await api.addWalletRequest({ amount, userId });
      // Update wallet balance in auth state
      const currentBalance = getState().auth.user?.wallet?.balance || 0;
      dispatch(updateWalletBalance(currentBalance + amount));
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit wallet request');
    }
  }
);

const initialState = {
  stats: {
    totalCampaigns: 0,
    sendtoteltemplet: 0,
    totalMessages: 0,
    totalSuccessCount: 0,
    totalFailedCount: 0,
    pendingMessages: 0,
    sentMessages: 0,
    failedMessages: 0
  },
  recentOrders: [],
  loading: {
    stats: false,
    orders: false,
    wallet: false
  },
  error: {
    stats: null,
    orders: null,
    wallet: null
  }
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = { stats: null, orders: null, wallet: null };
    },
    resetDashboard: () => initialState
  },
  extraReducers: (builder) => {
    // Fetch stats
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading.stats = true;
        state.error.stats = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading.stats = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading.stats = false;
        state.error.stats = action.payload;
      })
      
    // Fetch recent orders
      .addCase(fetchRecentOrders.pending, (state) => {
        state.loading.orders = true;
        state.error.orders = null;
      })
      .addCase(fetchRecentOrders.fulfilled, (state, action) => {
        state.loading.orders = false;
        state.recentOrders = action.payload;
      })
      .addCase(fetchRecentOrders.rejected, (state, action) => {
        state.loading.orders = false;
        state.error.orders = action.payload;
      })
      
    // Submit wallet request
      .addCase(submitWalletRequest.pending, (state) => {
        state.loading.wallet = true;
        state.error.wallet = null;
      })
      .addCase(submitWalletRequest.fulfilled, (state) => {
        state.loading.wallet = false;
      })
      .addCase(submitWalletRequest.rejected, (state, action) => {
        state.loading.wallet = false;
        state.error.wallet = action.payload;
      });
  }
});

export const { clearErrors, resetDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;