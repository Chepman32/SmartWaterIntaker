import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ReminderSchedule } from '../../types/models';

interface RemindersState {
  schedules: ReminderSchedule[];
  notificationsEnabled: boolean;
  permissionsGranted: boolean;
  smartRemindersEnabled: boolean;
  lastReminderTime?: string;
}

const initialState: RemindersState = {
  schedules: [],
  notificationsEnabled: false,
  permissionsGranted: false,
  smartRemindersEnabled: true,
};

const remindersSlice = createSlice({
  name: 'reminders',
  initialState,
  reducers: {
    upsertSchedule(state, action: PayloadAction<ReminderSchedule>) {
      const idx = state.schedules.findIndex(s => s.id === action.payload.id);
      if (idx === -1) state.schedules.push(action.payload);
      else state.schedules[idx] = action.payload;
    },
    deleteSchedule(state, action: PayloadAction<string>) {
      state.schedules = state.schedules.filter(s => s.id !== action.payload);
    },
    toggleSchedule(state, action: PayloadAction<{ id: string; enabled: boolean }>) {
      const s = state.schedules.find(x => x.id === action.payload.id);
      if (s) s.enabled = action.payload.enabled;
    },
    setNotificationsEnabled(state, action: PayloadAction<boolean>) {
      state.notificationsEnabled = action.payload;
    },
    setPermissionsGranted(state, action: PayloadAction<boolean>) {
      state.permissionsGranted = action.payload;
    },
    setSmartRemindersEnabled(state, action: PayloadAction<boolean>) {
      state.smartRemindersEnabled = action.payload;
    },
    setLastReminderTime(state, action: PayloadAction<string>) {
      state.lastReminderTime = action.payload;
    },
  },
});

export const { 
  upsertSchedule, 
  deleteSchedule, 
  toggleSchedule,
  setNotificationsEnabled,
  setPermissionsGranted,
  setSmartRemindersEnabled,
  setLastReminderTime,
} = remindersSlice.actions;
export default remindersSlice.reducer;