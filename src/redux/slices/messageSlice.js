import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler.jsx';
import { _get } from '../../helper/apiClient.jsx';
import { buildUrlWithParams } from '../../helper/helperFunction.js';

// Async thunks
export const fetchMessages = createAsyncThunkHandler(
  'messages/fetchAll',
  _get,
  (payload) => buildUrlWithParams('messages', payload)
);

export const fetchMessageStats = createAsyncThunkHandler(
  'messages/fetchStats',
  _get,
  'messages/stats'
);

export const fetchMessageById = createAsyncThunkHandler(
  'messages/fetchById',
  _get,
  (payload) => `messages/${payload.id}`
);

const messageSlice = createSlice({
  name: 'messages',
  initialState: {
    messages: [],
    stats: null,
    currentMessage: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentMessage: (state) => {
      state.currentMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload.data || [];
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMessageStats.fulfilled, (state, action) => {
        state.stats = action.payload.data;
      })
      .addCase(fetchMessageById.fulfilled, (state, action) => {
        state.currentMessage = action.payload.data;
      });
  },
});

export const { clearError, clearCurrentMessage } = messageSlice.actions;
export default messageSlice.reducer;