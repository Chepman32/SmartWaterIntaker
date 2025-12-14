import { configureStore } from '@reduxjs/toolkit';
import intakeReducer from './slices/intakeSlice';
import settingsReducer from './slices/settingsSlice';
import remindersReducer from './slices/remindersSlice';
import containersReducer from './slices/containersSlice';

export const store = configureStore({
  reducer: {
    intake: intakeReducer,
    settings: settingsReducer,
    reminders: remindersReducer,
    containers: containersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;