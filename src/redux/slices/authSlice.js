import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler.jsx';
import { _get, _post, _put } from '../../helper/apiClient.jsx';

// Auth thunks
export const loginUser = createAsyncThunkHandler(
  'user/login',
  _post,
  'user/login'
);

export const registerUser = createAsyncThunkHandler(
  'user/register',
  _post,
  'user/register'
);

export const getProfile = createAsyncThunkHandler(
  'user/getProfile',
  _get,
  'user/profile'
);

export const updateProfile = createAsyncThunkHandler(
  'user/updateProfile',
  _put,
  'user/profile'
);

// Admin thunks
export const createUser = createAsyncThunkHandler(
  'user/createUser',
  _post,
  'user/admin/create-user'
);

export const getAllUsers = createAsyncThunkHandler(
  'user/getAllUsers',
  _get,
  (payload) => `user/admin/users?page=${payload?.page || 1}&limit=${payload?.limit || 10}&role=${payload?.role || ''}&search=${payload?.search || ''}`
);

export const updateWallet = createAsyncThunkHandler(
  'user/updateWallet',
  _put,
  (payload) => `user/admin/wallet/${payload.userId}`
);

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  users: [],
  usersLoading: false,
  usersError: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.jio_token;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    updateWalletBalance: (state, action) => {
      if (state.user) {
        state.user.wallet = { ...state.user.wallet, balance: action.payload };
      }
    },
    clearError: (state) => {
      state.error = null;
      state.usersError = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.jio_token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.jio_token;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Get Profile
    builder
      .addCase(getProfile.fulfilled, (state, action) => {
        state.user = action.payload.data;
      })

    // Update Profile
    builder
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload.data;
      })

    // Create User (Admin)
    builder
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users.unshift(action.payload.data);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Get All Users (Admin)
    builder
      .addCase(getAllUsers.pending, (state) => {
        state.usersLoading = true;
        state.usersError = null;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.users = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.usersError = action.payload;
      })

    // Update Wallet (Admin)
    builder
      .addCase(updateWallet.fulfilled, (state, action) => {
        const userId = action.payload.data.userId;
        const userIndex = state.users.findIndex(u => u._id === userId);
        if (userIndex !== -1) {
          state.users[userIndex].wallet.balance = action.payload.data.newBalance;
        }
        // Update current user if it's their wallet
        if (state.user?._id === userId) {
          state.user.wallet.balance = action.payload.data.newBalance;
        }
      });
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, updateUser, updateWalletBalance, clearError } = authSlice.actions;
export default authSlice.reducer;