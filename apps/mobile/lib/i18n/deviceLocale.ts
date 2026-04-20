import { getLocales } from 'expo-localization';

export type AppLocale = 'nl' | 'en';

/** Map OS language to app locale (English as global fallback). */
export function resolveDeviceLocale(): AppLocale {
  const locales = getLocales?.() ?? [];
  const primary = locales[0];
  const tag = (
    primary?.languageTag ??
    primary?.languageCode ??
    'en'
  ).toLowerCase();
  return tag.startsWith('nl') ? 'nl' : 'en';
}
