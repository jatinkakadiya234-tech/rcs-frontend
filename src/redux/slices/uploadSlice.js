import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler.jsx';
import { _post } from '../../helper/apiClient.jsx';

// Async thunks
export const uploadFile = createAsyncThunkHandler(
  'upload/uploadFile',
  _post,
  'uploads/uploadFile',
  true // isMultipart flag for file uploads
);

const uploadSlice = createSlice({
  name: 'upload',
  initialState: {
    uploadedFiles: [],
    currentUpload: null,
    loading: false,
    error: null,
    uploadProgress: 0,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentUpload: (state) => {
      state.currentUpload = null;
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    resetUploadProgress: (state) => {
      state.uploadProgress = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadFile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.uploadProgress = 0;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUpload = action.payload.data;
        state.uploadedFiles.push(action.payload.data);
        state.uploadProgress = 100;
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.uploadProgress = 0;
      });
  },
});

export const { clearError, clearCurrentUpload, setUploadProgress, resetUploadProgress } = uploadSlice.actions;
export default uploadSlice.reducer;