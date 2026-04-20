import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import colorsLight, { ColorsDark } from '~/constants/Colors';
import type { AppColorPalette } from '~/lib/theme/types';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'deelbaar_theme_preference';

export type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (value: ThemePreference) => void;
  resolvedTheme: 'light' | 'dark';
  /** Resolved UI palette for React Native `StyleSheet` / vector icons (outside HeroUI/CSS tokens). */
  colors: AppColorPalette;
  isDark: boolean;
  isLoaded: boolean;
};

const ThemePreferenceContext = createContext<ThemeContextValue | null>(null);

export function useThemePreference() {
  const ctx = useContext(ThemePreferenceContext);
  if (!ctx) {
    throw new Error('useThemePreference must be used within ThemePreferenceProvider');
  }
  return ctx;
}

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const [preference, setPrefState] = useState<ThemePreference>('system');
  const [isLoaded, setIsLoaded] = useState(false);
  const systemScheme = useColorScheme();

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setPrefState(stored);
        }
      } catch {
        // keep default
      } finally {
        setIsLoaded(true);
      }
    };
    load().catch(() => {});
  }, []);

  const setPreference = useCallback((value: ThemePreference) => {
    setPrefState(value);
    AsyncStorage.setItem(STORAGE_KEY, value).catch(() => {});
  }, []);

  const resolvedTheme: 'light' | 'dark' = useMemo(() => {
    if (preference === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return preference;
  }, [preference, systemScheme]);

  const colors = useMemo<AppColorPalette>(
    () => (resolvedTheme === 'dark' ? ColorsDark : colorsLight),
    [resolvedTheme],
  );

  const isDark = resolvedTheme === 'dark';

  const value = useMemo(
    () => ({
      preference,
      setPreference,
      resolvedTheme,
      colors,
      isDark,
      isLoaded,
    }),
    [preference, setPreference, resolvedTheme, colors, isDark, isLoaded],
  );

  return (
    <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>
  );
}
