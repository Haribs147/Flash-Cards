import { configureStore } from '@reduxjs/toolkit';
import materialsReducer from '../features/materials/materialsSlice.tsx';

export const store = configureStore({
  reducer: {
    materials: materialsReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;