import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
  setDark: (v: boolean) => void;
  load: () => Promise<void>;
}

const THEME_KEY = 'theme_dark';

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: false,

  toggle: () => {
    const next = !get().isDark;
    set({ isDark: next });
    SecureStore.setItemAsync(THEME_KEY, next ? '1' : '0').catch(() => {});
  },

  setDark: (v: boolean) => {
    set({ isDark: v });
    SecureStore.setItemAsync(THEME_KEY, v ? '1' : '0').catch(() => {});
  },

  load: async () => {
    try {
      const val = await SecureStore.getItemAsync(THEME_KEY);
      if (val === '1') set({ isDark: true });
    } catch { /* ignore */ }
  },
}));
