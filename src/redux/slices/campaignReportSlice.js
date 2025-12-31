import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler.jsx';
import { _get, _post } from '../../helper/apiClient.jsx';
import { buildUrlWithParams } from '../../helper/helperFunction.js';

// Async thunks
export const generateCampaignReport = createAsyncThunkHandler(
  'campaignReports/generate',
  _post,
  (payload) => `campaign-reports/generate/${payload.campaignId}`
);

export const fetchCampaignReport = createAsyncThunkHandler(
  'campaignReports/fetchByCampaign',
  _get,
  (payload) => `campaign-reports/campaign/${payload.campaignId}`
);

export const fetchCampaignMessages = createAsyncThunkHandler(
  'campaignReports/fetchMessages',
  _get,
  (payload) => buildUrlWithParams(`campaign-reports/campaign/${payload.campaignId}/messages`, payload)
);

export const fetchUserCampaignReports = createAsyncThunkHandler(
  'campaignReports/fetchByUser',
  _get,
  (payload) => buildUrlWithParams(`campaign-reports/user/${payload.userId}`, payload)
);

const campaignReportSlice = createSlice({
  name: 'campaignReports',
  initialState: {
    reports: [],
    currentReport: null,
    campaignMessages: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
    messagesPagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentReport: (state, action) => {
      state.currentReport = action.payload;
    },
    clearCurrentReport: (state) => {
      state.currentReport = null;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateCampaignReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateCampaignReport.fulfilled, (state, action) => {
        state.loading = false;
        state.currentReport = action.payload.data;
      })
      .addCase(generateCampaignReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCampaignReport.fulfilled, (state, action) => {
        state.currentReport = action.payload.data;
      })
      .addCase(fetchCampaignMessages.fulfilled, (state, action) => {
        const data = action.payload.data;
        state.campaignMessages = Array.isArray(data) ? data : [];
        if (action.payload.pagination) {
          state.messagesPagination = action.payload.pagination;
        }
      })
      .addCase(fetchUserCampaignReports.fulfilled, (state, action) => {
        // Ensure data is always an array
        const data = action.payload.data;
        state.reports = Array.isArray(data) ? data : [];
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      });
  },
});

export const { clearError, setCurrentReport, clearCurrentReport, setPagination } = campaignReportSlice.actions;
export default campaignReportSlice.reducer;