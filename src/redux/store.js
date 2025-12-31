import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice.js';
import templateSlice from './slices/templateSlice.js';
import campaignSlice from './slices/campaignSlice.js';
import dashboardSlice from './slices/dashboardSlice.js';
import ordersSlice from './slices/ordersSlice.js';
import messageSlice from './slices/messageSlice.js';
import realtimeSlice from './slices/realtimeSlice.js';
import campaignReportSlice from './slices/campaignReportSlice.js';
import uploadSlice from './slices/uploadSlice.js';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth']
};

const rootReducer = combineReducers({
  auth: authSlice,
  templates: templateSlice,
  campaigns: campaignSlice,
  dashboard: dashboardSlice,
  orders: ordersSlice,
  messages: messageSlice,
  realtime: realtimeSlice,
  campaignReports: campaignReportSlice,
  upload: uploadSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);
export default store;