import { View } from 'react-native';

import { BottomSheet, Tabs } from 'heroui-native';

import { useLocale, type AppLocale } from '../../../context/LocaleContext';

const LANG_OPTIONS: ReadonlyArray<{ value: AppLocale; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'nl', label: 'Nederlands' },
];

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LanguageSheet({ isOpen, onOpenChange }: Props) {
  const { t, locale, setLocale } = useLocale();

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          <BottomSheet.Close />
          <BottomSheet.Title>{t('account.prefs.language')}</BottomSheet.Title>
          <View style={{ gap: 8 }}>
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
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
