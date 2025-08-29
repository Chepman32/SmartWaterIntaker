import { configureStore } from '@reduxjs/toolkit';
import intakeReducer from './slices/intakeSlice';
import settingsReducer from './slices/settingsSlice';
import purchasesReducer from './slices/purchasesSlice';
import remindersReducer from './slices/remindersSlice';
import containersReducer from './slices/containersSlice';

export const store = configureStore({
  reducer: {
    intake: intakeReducer,
    settings: settingsReducer,
    purchases: purchasesReducer,
    reminders: remindersReducer,
    containers: containersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;