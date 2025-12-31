import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler.jsx';
import { _get } from '../../helper/apiClient.jsx';

// Async thunks
export const fetchRealTimeCampaignStats = createAsyncThunkHandler(
  'realtime/fetchCampaignStats',
  _get,
  (payload) => `realtime/campaign/${payload.campaignId}/stats`
);

export const fetchLiveMessageFeed = createAsyncThunkHandler(
  'realtime/fetchMessageFeed',
  _get,
  (payload) => `realtime/campaign/${payload.campaignId}/feed`
);

export const fetchRecentWebhookEvents = createAsyncThunkHandler(
  'realtime/fetchWebhookEvents',
  _get,
  (payload) => `realtime/user/${payload.userId}/events`
);

export const fetchUserStats = createAsyncThunkHandler(
  'realtime/fetchUserStats',
  _get,
  (payload) => `realtime/user/${payload.userId}/stats`
);

export const fetchMessageStatusBreakdown = createAsyncThunkHandler(
  'realtime/fetchStatusBreakdown',
  _get,
  (payload) => `realtime/campaign/${payload.campaignId}/breakdown`
);

export const fetchUserInteractionSummary = createAsyncThunkHandler(
  'realtime/fetchInteractionSummary',
  _get,
  (payload) => `realtime/campaign/${payload.campaignId}/interactions`
);

const realtimeSlice = createSlice({
  name: 'realtime',
  initialState: {
    campaignStats: {},
    messageFeed: [],
    webhookEvents: [],
    userStats: null,
    statusBreakdown: null,
    interactionSummary: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateCampaignStats: (state, action) => {
      const { campaignId, stats } = action.payload;
      state.campaignStats[campaignId] = stats;
    },
    addMessageToFeed: (state, action) => {
      state.messageFeed.unshift(action.payload);
      if (state.messageFeed.length > 100) {
        state.messageFeed = state.messageFeed.slice(0, 100);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRealTimeCampaignStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRealTimeCampaignStats.fulfilled, (state, action) => {
        state.loading = false;
        const campaignId = action.meta.arg.campaignId;
        state.campaignStats[campaignId] = action.payload.data;
      })
      .addCase(fetchRealTimeCampaignStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchLiveMessageFeed.fulfilled, (state, action) => {
        state.messageFeed = action.payload.data || [];
      })
      .addCase(fetchRecentWebhookEvents.fulfilled, (state, action) => {
        state.webhookEvents = action.payload.data || [];
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.userStats = action.payload.data;
      })
      .addCase(fetchMessageStatusBreakdown.fulfilled, (state, action) => {
        state.statusBreakdown = action.payload.data;
      })
      .addCase(fetchUserInteractionSummary.fulfilled, (state, action) => {
        state.interactionSummary = action.payload.data;
      });
  },
});

export const { clearError, updateCampaignStats, addMessageToFeed } = realtimeSlice.actions;
export default realtimeSlice.reducer;