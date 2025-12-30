import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler.jsx';
import { _get, _post, _put, _delete } from '../../helper/apiClient.jsx';

// Campaign thunks
export const getAllCampaigns = createAsyncThunkHandler(
  'campaigns/getAll',
  _get,
  'campaigns'
);

export const getCampaignById = createAsyncThunkHandler(
  'campaigns/getById',
  _get,
  (payload) => `campaigns/${payload.id}`
);

export const createCampaign = createAsyncThunkHandler(
  'campaigns/create',
  _post,
  'campaigns'
);

export const sendBulkMessage = createAsyncThunkHandler(
  'campaigns/sendBulk',
  _post,
  'campaigns/send-bulk'
);

export const checkCapability = createAsyncThunkHandler(
  'campaigns/checkCapability',
  _post,
  'campaigns/check-capability'
);

export const getCampaignStats = createAsyncThunkHandler(
  'campaigns/getStats',
  _get,
  (payload) => `campaigns/${payload.id}/stats`
);

export const pauseCampaign = createAsyncThunkHandler(
  'campaigns/pause',
  _put,
  (payload) => `campaigns/${payload.id}/pause`
);

export const resumeCampaign = createAsyncThunkHandler(
  'campaigns/resume',
  _put,
  (payload) => `campaigns/${payload.id}/resume`
);

export const deleteCampaign = createAsyncThunkHandler(
  'campaigns/delete',
  _delete,
  (payload) => `campaigns/${payload.id}`
);

const initialState = {
  campaigns: [],
  currentCampaign: null,
  loading: false,
  sendingMessage: false,
  error: null,
  messageError: null,
  capabilityResults: [],
  stats: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
};

const campaignSlice = createSlice({
  name: 'campaigns',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.messageError = null;
    },
    setCurrentCampaign: (state, action) => {
      state.currentCampaign = action.payload;
    },
    clearCurrentCampaign: (state) => {
      state.currentCampaign = null;
    },
    clearCapabilityResults: (state) => {
      state.capabilityResults = [];
    },
  },
  extraReducers: (builder) => {
    // Get All Campaigns
    builder
      .addCase(getAllCampaigns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllCampaigns.fulfilled, (state, action) => {
        state.loading = false;
        state.campaigns = action.payload.data;
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(getAllCampaigns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Get Campaign By ID
    builder
      .addCase(getCampaignById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCampaignById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCampaign = action.payload.data;
      })
      .addCase(getCampaignById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Create Campaign
    builder
      .addCase(createCampaign.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCampaign.fulfilled, (state, action) => {
        state.loading = false;
        state.campaigns.unshift(action.payload.data);
      })
      .addCase(createCampaign.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Send Bulk Message
    builder
      .addCase(sendBulkMessage.pending, (state) => {
        state.sendingMessage = true;
        state.messageError = null;
      })
      .addCase(sendBulkMessage.fulfilled, (state, action) => {
        state.sendingMessage = false;
        state.campaigns.unshift(action.payload.data);
      })
      .addCase(sendBulkMessage.rejected, (state, action) => {
        state.sendingMessage = false;
        state.messageError = action.payload;
      })

    // Check Capability
    builder
      .addCase(checkCapability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkCapability.fulfilled, (state, action) => {
        state.loading = false;
        state.capabilityResults = action.payload.data;
      })
      .addCase(checkCapability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Get Campaign Stats
    builder
      .addCase(getCampaignStats.fulfilled, (state, action) => {
        state.stats = action.payload.data;
      })

    // Pause Campaign
    builder
      .addCase(pauseCampaign.fulfilled, (state, action) => {
        const index = state.campaigns.findIndex(c => c._id === action.payload.data._id);
        if (index !== -1) {
          state.campaigns[index] = action.payload.data;
        }
      })

    // Resume Campaign
    builder
      .addCase(resumeCampaign.fulfilled, (state, action) => {
        const index = state.campaigns.findIndex(c => c._id === action.payload.data._id);
        if (index !== -1) {
          state.campaigns[index] = action.payload.data;
        }
      })

    // Delete Campaign
    builder
      .addCase(deleteCampaign.fulfilled, (state, action) => {
        state.campaigns = state.campaigns.filter(c => c._id !== action.meta.arg.id);
      });
  },
});

export const { clearError, setCurrentCampaign, clearCurrentCampaign, clearCapabilityResults } = campaignSlice.actions;
export default campaignSlice.reducer;