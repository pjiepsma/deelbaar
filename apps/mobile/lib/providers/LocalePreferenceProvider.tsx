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

import type { AppLocale } from '~/lib/i18n/deviceLocale';
import { resolveDeviceLocale } from '~/lib/i18n/deviceLocale';
import i18n from '~/lib/i18n/i18n';

const STORAGE_KEY = 'deelbaar_locale_preference';

/** Stored preference; `system` follows the device locale (NL vs EN). */
export type LocalePreference = AppLocale | 'system';

export type LocaleContextValue = {
  preference: LocalePreference;
  setPreference: (value: LocalePreference) => void;
  /** Resolved UI locale passed to i18n. */
  resolvedLocale: AppLocale;
  isLoaded: boolean;
};

const LocalePreferenceContext = createContext<LocaleContextValue | null>(null);

export function useLocalePreference() {
  const ctx = useContext(LocalePreferenceContext);
  if (!ctx) {
    throw new Error('useLocalePreference must be used within LocalePreferenceProvider');
  }
  return ctx;
}

export function LocalePreferenceProvider({ children }: { children: ReactNode }) {
  const [preference, setPrefState] = useState<LocalePreference>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'nl' || stored === 'en' || stored === 'system') {
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

  const resolvedLocale: AppLocale = useMemo(() => {
    if (preference === 'system') {
      return resolveDeviceLocale();
    }
    return preference;
  }, [preference]);

  useEffect(() => {
    if (!isLoaded) return;
    void i18n.changeLanguage(resolvedLocale);
  }, [resolvedLocale, isLoaded]);

  const setPreference = useCallback((value: LocalePreference) => {
    setPrefState(value);
    AsyncStorage.setItem(STORAGE_KEY, value).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      preference,
      setPreference,
      resolvedLocale,
      isLoaded,
    }),
    [preference, setPreference, resolvedLocale, isLoaded],
  );

  return (
    <LocalePreferenceContext.Provider value={value}>{children}</LocalePreferenceContext.Provider>
  );
}
