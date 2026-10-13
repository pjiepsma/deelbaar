import Constants from 'expo-constants';
import { Text, View } from 'react-native';

import { BottomSheet, Button, Tabs } from 'heroui-native';

import { useLocale, type AppLocale } from '../../../context/LocaleContext';
import { useThemePreference, type ThemePreference } from '../../../context/ThemePreferenceContext';
import type { CmsLegalPage } from '../../../lib/legal/cmsLegal.types';
import { navigateToLegalDocument } from '../../../navigation/rootNavigation';

const THEME_OPTIONS: ReadonlyArray<{ value: ThemePreference; key: 'themeSystem' | 'themeLight' | 'themeDark' }> = [
  { value: 'system', key: 'themeSystem' },
  { value: 'light', key: 'themeLight' },
  { value: 'dark', key: 'themeDark' },
];

const LANG_OPTIONS: ReadonlyArray<{ value: AppLocale; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'nl', label: 'Nederlands' },
];

const LEGAL_PAGES: ReadonlyArray<{ page: CmsLegalPage; key: 'terms' | 'privacy' | 'about' }> = [
  { page: 'terms', key: 'terms' },
  { page: 'privacy', key: 'privacy' },
  { page: 'about', key: 'about' },
];

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PreferencesSheet({ isOpen, onOpenChange }: Props) {
  const { t, locale, setLocale } = useLocale();
  const { preference, setPreference } = useThemePreference();
  const appVersion = Constants.expoConfig?.version ?? Constants.nativeAppVersion;

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          <BottomSheet.Close />
          <BottomSheet.Title>{t('account.prefs.title')}</BottomSheet.Title>
          <View style={{ gap: 20 }}>
            <View style={{ gap: 8 }}>
              <Text className="text-muted text-sm font-medium">{t('account.prefs.theme')}</Text>
              <Tabs
                value={preference}
                onValueChange={(v) => void setPreference(v as ThemePreference)}
                variant="secondary"
              >
                <Tabs.List>
                  <Tabs.Indicator />
                  {THEME_OPTIONS.map((opt) => (
                    <Tabs.Trigger key={opt.value} value={opt.value}>
                      <Tabs.Label>{t(`account.prefs.${opt.key}`)}</Tabs.Label>
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>
              </Tabs>
            </View>

            <View style={{ gap: 8 }}>
              <Text className="text-muted text-sm font-medium">{t('account.prefs.language')}</Text>
              <Tabs
                value={locale}
                onValueChange={(v) => void setLocale(v as AppLocale)}
                variant="secondary"
              >
                <Tabs.List>
                  <Tabs.Indicator />
                  {LANG_OPTIONS.map((opt) => (
                    <Tabs.Trigger key={opt.value} value={opt.value}>
                      <Tabs.Label>{opt.label}</Tabs.Label>
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>
              </Tabs>
            </View>

            <View style={{ gap: 4 }}>
              <Text className="text-muted text-sm font-medium">{t('account.prefs.legal')}</Text>
              {LEGAL_PAGES.map((item) => (
                <Button
                  key={item.page}
                  variant="ghost"
                  onPress={() => navigateToLegalDocument({ page: item.page })}
                  className="self-start"
                >
                  <Button.Label>{t(`account.prefs.${item.key}`)}</Button.Label>
                </Button>
              ))}
            </View>

            {appVersion ? (
              <Text className="text-muted text-xs">
                {t('account.prefs.version', { version: String(appVersion) })}
              </Text>
            ) : null}
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
