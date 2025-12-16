import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IntakeEvent } from '../../types/models';
import { StorageService } from '../../services/storage';
import type { RootState } from '../store';

function getLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
}

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
      const todayStr = getLocalDateString(new Date());
      const eventDateStr = getLocalDateString(
        new Date(action.payload.timestamp),
      );
      if (eventDateStr === todayStr) {
        state.todayTotalMl += action.payload.amountMl;
      }
    },
    deleteEvent(state, action: PayloadAction<string>) {
      const idx = state.events.findIndex(e => e.id === action.payload);
      if (idx !== -1) {
        const todayStr = getLocalDateString(new Date());
        const eventDateStr = getLocalDateString(
          new Date(state.events[idx].timestamp),
        );
        if (eventDateStr === todayStr) {
          state.todayTotalMl -= state.events[idx].amountMl;
        }
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
      const todayStr = getLocalDateString(new Date());
      state.todayTotalMl = state.events
        .filter(e => getLocalDateString(new Date(e.timestamp)) === todayStr)
        .reduce((sum, e) => sum + e.amountMl, 0);
    },
  },
});

export const { addEvent, deleteEvent, resetDay, setDailyGoal, setEvents } =
  intakeSlice.actions;
export default intakeSlice.reducer;

// Thunks for persistence
export const initIntakeFromStorage = () => (dispatch: any) => {
  try {
    const allEvents =
      StorageService.getAllIntakeEvents?.() ?? StorageService.getIntakeEvents();
    dispatch(setEvents(allEvents));
    const goal = StorageService.getDailyGoal();
    if (goal?.computed) {
      dispatch(setDailyGoal(goal.computed));
    }
  } catch (e) {
    // no-op
  }
};

export const logIntakeEvent =
  (
    payload: Omit<IntakeEvent, 'id' | 'timestamp'> & {
      amountMl: number;
      timestamp?: number;
    },
  ) =>
  (dispatch: any) => {
    try {
      const timestamp = payload.timestamp ?? Date.now();
      const saved = StorageService.addIntakeEvent({
        timestamp,
        amountMl: payload.amountMl,
        source: payload.source,
        containerId: payload.containerId,
        drinkTypeId: payload.drinkTypeId,
        note: payload.note,
      });
      dispatch(addEvent(saved));
    } catch (error) {
      console.warn('Failed to log intake event:', error);
      // Still dispatch the event to update UI even if storage fails
      const fallbackEvent: IntakeEvent = {
        id: `${Date.now()}`,
        timestamp: payload.timestamp ?? Date.now(),
        amountMl: payload.amountMl,
        source: payload.source,
        containerId: payload.containerId,
        drinkTypeId: payload.drinkTypeId,
        note: payload.note,
      };
      dispatch(addEvent(fallbackEvent));
    }
  };

export const deleteIntakeEventAndPersist =
  (id: string, dateISO: string) => (dispatch: any) => {
    try {
      StorageService.deleteIntakeEvent(id, dateISO);
    } catch (error) {
      console.warn('Failed to delete intake event from storage:', error);
    }
    dispatch(deleteEvent(id));
  };
