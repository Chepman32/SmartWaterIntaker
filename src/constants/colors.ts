// Water-themed color palette for light and dark themes
export const Colors = {
  light: {
    // Water theme - blues and teals
    primary: '#0EA5E9', // Sky blue
    primaryDark: '#0284C7', // Darker blue
    secondary: '#14B8A6', // Teal
    background: '#F8FAFC',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    // Progress ring colors
    progressTrack: '#E2E8F0',
    progressFill: '#0EA5E9',
    // Water wave colors
    wave: '#0EA5E940',
    waveDark: '#0EA5E960',
  },
  dark: {
    primary: '#38BDF8',
    primaryDark: '#0284C7', 
    secondary: '#2DD4BF',
    background: '#0F172A',
    surface: '#1E293B',
    card: '#334155',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    border: '#475569',
    progressTrack: '#475569',
    progressFill: '#38BDF8',
    wave: '#38BDF840',
    waveDark: '#38BDF860',
  },
  // Pro themes (additional palettes)
  pro1: {
    // Ocean theme
    primary: '#1E40AF',
    secondary: '#059669',
    // ... more colors
  },
  pro2: {
    // Mint theme  
    primary: '#10B981',
    secondary: '#06B6D4',
  },
  pro3: {
    // Sunset theme
    primary: '#F59E0B',
    secondary: '#EF4444',
  },
};

export type ThemeColors = typeof Colors.light;