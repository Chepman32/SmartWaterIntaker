import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Settings, Unit, UserProfile } from '../../types/models';

interface SettingsState {
  settings: Settings;
  profile: UserProfile;
}

const now = Date.now();

const initialState: SettingsState = {
  settings: {
    theme: 'system',
    haptics: true,
    sounds: true,
    quickAddsMl: [150, 250, 330, 500],
  },
  profile: {
    unit: 'ml',
    activityLevel: 'medium',
    climate: 'temperate',
    createdAt: now,
    updatedAt: now,
  },
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setUnit(state, action: PayloadAction<Unit>) {
      state.profile.unit = action.payload;
      state.profile.updatedAt = Date.now();
    },
    setTheme(state, action: PayloadAction<Settings['theme']>) {
      state.settings.theme = action.payload;
    },
    setQuickAdds(state, action: PayloadAction<number[]>) {
      state.settings.quickAddsMl = action.payload;
    },
    updateProfile(state, action: PayloadAction<Partial<UserProfile>>) {
      state.profile = { ...state.profile, ...action.payload, updatedAt: Date.now() };
    },
  },
});

export const { setUnit, setTheme, setQuickAdds, updateProfile } = settingsSlice.actions;
export default settingsSlice.reducer;