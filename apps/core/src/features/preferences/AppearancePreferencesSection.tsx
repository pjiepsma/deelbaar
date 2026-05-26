import { Label, Radio, RadioGroup } from 'heroui-native';
import { Text, View } from 'react-native';

import { SectionHeader } from '../../components/shared';
import { useLocale, type AppLocale } from '../../context/LocaleContext';
import { useThemePreference, type ThemePreference } from '../../context/ThemePreferenceContext';

export interface AppearancePreferencesSectionProps {
  showSectionTitle?: boolean;
  compact?: boolean;
  splitSections?: boolean;
}

const THEME_OPTIONS: ReadonlyArray<{ value: ThemePreference; labelKey: 'themeSystem' | 'themeLight' | 'themeDark' }> =
  [
    { value: 'system', labelKey: 'themeSystem' },
    { value: 'light', labelKey: 'themeLight' },
    { value: 'dark', labelKey: 'themeDark' },
  ];

const LANGUAGE_OPTIONS: ReadonlyArray<{ value: AppLocale; labelKey: 'langEnglish' | 'langNederlands' }> = [
  { value: 'en', labelKey: 'langEnglish' },
  { value: 'nl', labelKey: 'langNederlands' },
];

export function ThemePreferenceControl({
  compact = false,
  horizontal = false,
}: {
  compact?: boolean;
  horizontal?: boolean;
}) {
  const { preference, setPreference } = useThemePreference();
  const { t } = useLocale();

  const onThemeChange = (value: string): void => {
    void setPreference(value as ThemePreference);
  };

  return (
    <RadioGroup value={preference} onValueChange={onThemeChange}>
      <View
        style={
          horizontal
            ? { flexDirection: 'row', flexWrap: 'wrap', columnGap: compact ? 8 : 12, rowGap: compact ? 4 : 8 }
            : undefined
        }
      >
        {THEME_OPTIONS.map((option) => (
          <RadioGroup.Item key={option.value} value={option.value} style={horizontal ? { flexGrow: 1 } : undefined}>
            <Label>{t(`appearance.${option.labelKey}`)}</Label>
            <Radio />
          </RadioGroup.Item>
        ))}
      </View>
    </RadioGroup>
  );
}

export function LanguagePreferenceControl({
  compact = false,
  horizontal = false,
}: {
  compact?: boolean;
  horizontal?: boolean;
}) {
  const { locale, setLocale, t } = useLocale();

  const onLocaleChange = (value: string): void => {
    void setLocale(value as AppLocale);
  };

  return (
    <RadioGroup value={locale} onValueChange={onLocaleChange}>
      <View
        style={
          horizontal
            ? { flexDirection: 'row', flexWrap: 'wrap', columnGap: compact ? 8 : 12, rowGap: compact ? 4 : 8 }
            : undefined
        }
      >
        {LANGUAGE_OPTIONS.map((option) => (
          <RadioGroup.Item key={option.value} value={option.value} style={horizontal ? { flexGrow: 1 } : undefined}>
            <Label>{t(`appearance.${option.labelKey}`)}</Label>
            <Radio />
          </RadioGroup.Item>
        ))}
      </View>
    </RadioGroup>
  );
}

export function AppearancePreferencesSection({
  showSectionTitle = true,
  compact = false,
  splitSections = false,
}: AppearancePreferencesSectionProps) {
  const { t } = useLocale();
  const blockGap = compact ? 8 : 16;
  const labelClass = compact ? 'text-muted mb-1 text-sm' : 'text-muted mb-2 text-sm';

  if (splitSections) {
    return (
      <View style={{ gap: blockGap }}>
        <View>
          {showSectionTitle ? <SectionHeader title={t('appearance.theme')} compact={compact} /> : null}
          <ThemePreferenceControl compact={compact} horizontal />
        </View>
        <View>
          {showSectionTitle ? <SectionHeader title={t('appearance.language')} compact={compact} /> : null}
          <LanguagePreferenceControl compact={compact} horizontal />
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: blockGap }}>
      <View>
        {showSectionTitle ? <SectionHeader title={t('appearance.sectionTitle')} compact={compact} /> : null}
        <Text className={labelClass}>{t('appearance.theme')}</Text>
        <ThemePreferenceControl compact={compact} />
      </View>
      <View>
        <Text className={labelClass}>{t('appearance.language')}</Text>
        <LanguagePreferenceControl compact={compact} />
      </View>
    </View>
  );
}
