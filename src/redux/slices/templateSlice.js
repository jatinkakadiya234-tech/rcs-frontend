import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler.jsx';
import { _get, _post, _put, _delete } from '../../helper/apiClient.jsx';

// Template thunks
export const getAllTemplates = createAsyncThunkHandler(
  'templates/getAll',
  _get,
  'templates'
);

export const fetchUserTemplates = createAsyncThunkHandler(
  'templates/fetchUserTemplates',
  _get,
  (payload) => `templates?userId=${payload.userId}&limit=${payload.limit || 50}`
);

export const getTemplateById = createAsyncThunkHandler(
  'templates/getById',
  _get,
  (payload) => `templates/${payload.id}`
);

export const createTemplate = createAsyncThunkHandler(
  'templates/create',
  _post,
  'templates'
);

export const updateTemplate = createAsyncThunkHandler(
  'templates/update',
  _put,
  (payload) => `templates/${payload.id}`
);

export const deleteTemplate = createAsyncThunkHandler(
  'templates/delete',
  _delete,
  (payload) => `templates/${payload.id}`
);

const initialState = {
  templates: [],
  currentTemplate: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
};

const templateSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentTemplate: (state, action) => {
      state.currentTemplate = action.payload;
    },
    clearCurrentTemplate: (state) => {
      state.currentTemplate = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch User Templates
    builder
      .addCase(fetchUserTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = action.payload.data;
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchUserTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Get All Templates
    builder
      .addCase(getAllTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = action.payload.data;
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(getAllTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Get Template By ID
    builder
      .addCase(getTemplateById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTemplateById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTemplate = action.payload.data;
      })
      .addCase(getTemplateById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Create Template
    builder
      .addCase(createTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTemplate.fulfilled, (state, action) => {
        state.loading = false;
        state.templates.unshift(action.payload.data);
      })
      .addCase(createTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Update Template
    builder
      .addCase(updateTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTemplate.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.templates.findIndex(t => t._id === action.payload.data._id);
        if (index !== -1) {
          state.templates[index] = action.payload.data;
        }
        state.currentTemplate = action.payload.data;
      })
      .addCase(updateTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Delete Template
    builder
      .addCase(deleteTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = state.templates.filter(t => t._id !== action.meta.arg.id);
      })
      .addCase(deleteTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setCurrentTemplate, clearCurrentTemplate } = templateSlice.actions;
export default templateSlice.reducer;