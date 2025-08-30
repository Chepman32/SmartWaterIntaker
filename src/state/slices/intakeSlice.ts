import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IntakeEvent } from '../../types/models';
import { StorageService } from '../../services/storage';
import type { RootState } from '../store';

type IntakeState = {
  events: IntakeEvent[];
  todayTotalMl: number;
  dailyGoalMl: number;
};

const initialState: IntakeState = {
  events: [],
  todayTotalMl: 0,
  dailyGoalMl: 2000,
};

const intakeSlice = createSlice({
  name: 'intake',
  initialState,
  reducers: {
    addEvent(state, action: PayloadAction<IntakeEvent>) {
      state.events.unshift(action.payload);
      state.todayTotalMl += action.payload.amountMl;
    },
    deleteEvent(state, action: PayloadAction<string>) {
      const idx = state.events.findIndex(e => e.id === action.payload);
      if (idx !== -1) {
        state.todayTotalMl -= state.events[idx].amountMl;
        state.events.splice(idx, 1);
      }
    },
    resetDay(state) {
      state.todayTotalMl = 0;
    },
    setDailyGoal(state, action: PayloadAction<number>) {
      state.dailyGoalMl = action.payload;
    },
    setEvents(state, action: PayloadAction<IntakeEvent[]>) {
      state.events = action.payload.sort((a, b) => b.timestamp - a.timestamp);
      const todayStr = new Date().toISOString().split('T')[0];
      state.todayTotalMl = state.events
        .filter(e => new Date(e.timestamp).toISOString().slice(0,10) === todayStr)
        .reduce((sum, e) => sum + e.amountMl, 0);
    },
  },
});

export const { addEvent, deleteEvent, resetDay, setDailyGoal, setEvents } = intakeSlice.actions;
export default intakeSlice.reducer;

// Thunks for persistence
export const initIntakeFromStorage = () => (dispatch: any) => {
  try {
    const allEvents = StorageService.getAllIntakeEvents?.()
      ?? StorageService.getIntakeEvents();
    dispatch(setEvents(allEvents));
    const goal = StorageService.getDailyGoal();
    if (goal?.computed) {
      dispatch(setDailyGoal(goal.computed));
    }
  } catch (e) {
    // no-op
  }
};

export const logIntakeEvent = (payload: Omit<IntakeEvent, 'id' | 'timestamp'> & { amountMl: number; timestamp?: number }) => (dispatch: any) => {
  const timestamp = payload.timestamp ?? Date.now();
  const saved = StorageService.addIntakeEvent({
    timestamp,
    amountMl: payload.amountMl,
    source: payload.source,
    containerId: payload.containerId,
    note: payload.note,
  });
  dispatch(addEvent(saved));
};

export const deleteIntakeEventAndPersist = (id: string, dateISO: string) => (dispatch: any) => {
  StorageService.deleteIntakeEvent(id, dateISO);
  dispatch(deleteEvent(id));
};
