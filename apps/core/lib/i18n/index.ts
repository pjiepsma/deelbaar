/**
 * App internationalization (react-i18next).
 *
 * Import `~/lib/i18n/i18n` once in the root layout (side-effect init),
 * wrap the tree with `LocalePreferenceProvider`, then use `useTranslation()` from `react-i18next`
 * or import from here for convenience.
 */

export { default as i18n } from '~/lib/i18n/i18n';
export type { AppLocale } from '~/lib/i18n/deviceLocale';
export { resolveDeviceLocale } from '~/lib/i18n/deviceLocale';
export {
  LocalePreferenceProvider,
  useLocalePreference,
  type LocalePreference,
  type LocaleContextValue,
} from '~/lib/providers/LocalePreferenceProvider';

export { useTranslation } from 'react-i18next';
