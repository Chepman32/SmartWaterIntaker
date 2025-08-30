import { useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';
import { Colors, ThemeColors } from '../constants/colors';
import { RootState } from '../state/store';

type Mode = 'light' | 'dark';

function mergeTheme(base: ThemeColors, override?: Partial<ThemeColors>): ThemeColors {
  return {
    ...base,
    ...(override as ThemeColors | undefined),
  };
}

export function useTheme(): { theme: ThemeColors; mode: Mode } {
  const system = useColorScheme();
  const themeSetting = useSelector((s: RootState) => s.settings.settings.theme);

  let mode: Mode;
  if (themeSetting === 'system') {
    mode = system === 'dark' ? 'dark' : 'light';
  } else if (themeSetting === 'dark') {
    mode = 'dark';
  } else {
    // 'light' or pro variants default to light unless system dictates otherwise for pro
    mode = themeSetting.startsWith('pro') ? (system === 'dark' ? 'dark' : 'light') : 'light';
  }

  const base = mode === 'dark' ? Colors.dark : Colors.light;

  // Support pro themes by overlaying primary/secondary while keeping required keys
  let theme: ThemeColors = base;
  if (themeSetting === 'pro1' || themeSetting === 'pro2' || themeSetting === 'pro3') {
    const override = (Colors as any)[themeSetting] as Partial<ThemeColors> | undefined;
    theme = mergeTheme(base, override);
  }

  return { theme, mode };
}

export function useThemeColors(): ThemeColors {
  return useTheme().theme;
}


