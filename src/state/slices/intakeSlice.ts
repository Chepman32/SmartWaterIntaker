import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IntakeEvent } from '../../types/models';

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
  },
});

export const { addEvent, deleteEvent, resetDay, setDailyGoal } = intakeSlice.actions;
export default intakeSlice.reducer;