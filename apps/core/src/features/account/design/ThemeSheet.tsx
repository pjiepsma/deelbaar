import { View } from 'react-native';

import { BottomSheet, Tabs } from 'heroui-native';

import { useLocale } from '../../../context/LocaleContext';
import { useThemePreference, type ThemePreference } from '../../../context/ThemePreferenceContext';

const THEME_OPTIONS: ReadonlyArray<{
  value: ThemePreference;
  key: 'themeSystem' | 'themeLight' | 'themeDark';
}> = [
  { value: 'system', key: 'themeSystem' },
  { value: 'light', key: 'themeLight' },
  { value: 'dark', key: 'themeDark' },
];

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ThemeSheet({ isOpen, onOpenChange }: Props) {
  const { t } = useLocale();
  const { preference, setPreference } = useThemePreference();

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          <BottomSheet.Close />
          <BottomSheet.Title>{t('account.prefs.theme')}</BottomSheet.Title>
          <View style={{ gap: 8 }}>
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
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
