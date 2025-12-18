import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Settings, Unit, UserProfile } from '../../types/models';
import { StorageService } from '../../services/storage';
import { getDetectedDeviceLanguage } from '../../i18n';

interface SettingsState {
  settings: Settings;
  profile: UserProfile;
}

const now = Date.now();

// Load persisted settings from storage
const loadInitialSettings = (): Settings => {
  const stored = StorageService.getSettings();
  const storedProfile = StorageService.getProfile();

  // If onboarding not completed, use device language; otherwise use stored or fallback to 'en'
  const language = stored?.language
    ? stored.language
    : storedProfile?.onboardingCompleted
    ? 'en'
    : getDetectedDeviceLanguage();

  return {
    theme: stored?.theme ?? 'system',
    haptics: stored?.haptics ?? true,
    sounds: stored?.sounds ?? true,
    language,
    quickAddsMl: stored?.quickAddsMl ?? [150, 250, 330, 500],
  };
};

// Load persisted profile from storage
const loadInitialProfile = (): UserProfile => {
  const stored = StorageService.getProfile();
  return {
    unit: stored?.unit ?? 'ml',
    activityLevel: stored?.activityLevel ?? 'medium',
    climate: stored?.climate ?? 'temperate',
    createdAt: stored?.createdAt ?? now,
    updatedAt: stored?.updatedAt ?? now,
  };
};

const initialState: SettingsState = {
  settings: loadInitialSettings(),
  profile: loadInitialProfile(),
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
    setHaptics(state, action: PayloadAction<boolean>) {
      state.settings.haptics = action.payload;
    },
    setSounds(state, action: PayloadAction<boolean>) {
      state.settings.sounds = action.payload;
    },
    setLanguage(state, action: PayloadAction<string>) {
      state.settings.language = action.payload;
    },
    setQuickAdds(state, action: PayloadAction<number[]>) {
      state.settings.quickAddsMl = action.payload;
    },
    updateProfile(state, action: PayloadAction<Partial<UserProfile>>) {
      state.profile = {
        ...state.profile,
        ...action.payload,
        updatedAt: Date.now(),
      };
    },
  },
});

export const {
  setUnit,
  setTheme,
  setHaptics,
  setSounds,
  setLanguage,
  setQuickAdds,
  updateProfile,
} = settingsSlice.actions;

export const selectOnboardingCompleted = (state: { settings: SettingsState }) =>
  state.settings.profile.onboardingCompleted ?? false;
export default settingsSlice.reducer;
