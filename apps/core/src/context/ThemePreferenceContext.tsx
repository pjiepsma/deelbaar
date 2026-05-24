import * as SecureStore from 'expo-secure-store';
import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Uniwind } from 'uniwind';

import { appPreferencesConfig } from '../config/appPreferences.config';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedColorScheme = 'light' | 'dark';

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

type ThemePreferenceContextValue = {
  preference: ThemePreference;
  resolvedScheme: ResolvedColorScheme;
  setPreference: (next: ThemePreference) => Promise<void>;
  isHydrated: boolean;
};

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

export function ThemePreferenceProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const raw = await SecureStore.getItemAsync(appPreferencesConfig.secureStorageKeys.themePreference);
      if (!cancelled && isThemePreference(raw)) {
        setPreferenceState(raw);
      }
      if (!cancelled) {
        setIsHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedScheme: ResolvedColorScheme = useMemo(() => {
    if (preference === 'light') {
      return 'light';
    }
    if (preference === 'dark') {
      return 'dark';
    }
    return systemScheme === 'dark' ? 'dark' : 'light';
  }, [preference, systemScheme]);

  useEffect(() => {
    Uniwind.setTheme(resolvedScheme);
  }, [resolvedScheme]);

  const setPreference = useCallback(async (next: ThemePreference) => {
    setPreferenceState(next);
    await SecureStore.setItemAsync(appPreferencesConfig.secureStorageKeys.themePreference, next);
  }, []);

  const value = useMemo(
    () => ({
      preference,
      resolvedScheme,
      setPreference,
      isHydrated,
    }),
    [preference, resolvedScheme, setPreference, isHydrated],
  );

  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference(): ThemePreferenceContextValue {
  const ctx = useContext(ThemePreferenceContext);
  if (!ctx) {
    throw new Error('useThemePreference must be used within ThemePreferenceProvider');
  }
  return ctx;
}
