import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resolveDeviceLocale } from '~/lib/i18n/deviceLocale';
import { en } from '~/lib/i18n/resources/en';
import { nl } from '~/lib/i18n/resources/nl';

void i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    nl: { translation: nl },
    en: { translation: en },
  },
  lng: resolveDeviceLocale(),
  fallbackLng: 'nl',
  supportedLngs: ['nl', 'en'],
  interpolation: { escapeValue: false },
});

export default i18n;
