import * as Localization from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { appPreferencesConfig } from '../config/appPreferences.config';
import { en, nl, type Messages } from '../i18n/catalog';

export type AppLocale = 'en' | 'nl';

const trees: Record<AppLocale, Messages> = { en, nl };

function deviceDefaultLocale(): AppLocale {
  const code = Localization.getLocales()[0]?.languageCode?.toLowerCase();
  return code === 'nl' ? 'nl' : 'en';
}

function isAppLocale(value: string | null): value is AppLocale {
  return value === 'en' || value === 'nl';
}

function getMessage(locale: AppLocale, path: string): string {
  const parts = path.split('.');
  let cur: unknown = trees[locale];
  for (const p of parts) {
    if (!cur || typeof cur !== 'object' || !(p in cur)) {
      throw new Error(`Missing i18n path "${path}" for locale ${locale}`);
    }
    cur = (cur as Record<string, unknown>)[p];
  }
  if (typeof cur !== 'string') {
    throw new Error(`i18n path "${path}" is not a leaf string (${locale})`);
  }
  return cur;
}

function applyVars(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.split(`{{${key}}}`).join(value);
  }
  return out;
}

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (next: AppLocale) => Promise<void>;
  t: (path: string, vars?: Record<string, string>) => string;
  isHydrated: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<AppLocale>(deviceDefaultLocale);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const raw = await SecureStore.getItemAsync(appPreferencesConfig.secureStorageKeys.appLocale);
      if (!cancelled && isAppLocale(raw)) {
        setLocaleState(raw);
      }
      if (!cancelled) {
        setIsHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback(async (next: AppLocale) => {
    setLocaleState(next);
    await SecureStore.setItemAsync(appPreferencesConfig.secureStorageKeys.appLocale, next);
  }, []);

  const t = useCallback(
    (path: string, vars?: Record<string, string>) => {
      const base = getMessage(locale, path);
      return vars ? applyVars(base, vars) : base;
    },
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      isHydrated,
    }),
    [locale, setLocale, t, isHydrated],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return ctx;
}
