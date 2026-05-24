import { Label, Radio, RadioGroup } from 'heroui-native';
import { Text, View } from 'react-native';

import { useLocale, type AppLocale } from '../../context/LocaleContext';
import { useThemePreference, type ThemePreference } from '../../context/ThemePreferenceContext';
import { PROFILE_SETTINGS_SECTION_FONT_SIZE } from '../profile/profile.constants';

export function AppearancePreferencesSection() {
  const { preference, setPreference } = useThemePreference();
  const { locale, setLocale, t } = useLocale();

  const onThemeChange = (value: string): void => {
    void setPreference(value as ThemePreference);
  };

  const onLocaleChange = (value: string): void => {
    void setLocale(value as AppLocale);
  };

  return (
    <View style={{ gap: 16 }}>
      <View>
        <Text className="mb-2 font-bold text-foreground" style={{ fontSize: PROFILE_SETTINGS_SECTION_FONT_SIZE }}>
          {t('appearance.sectionTitle')}
        </Text>
        <Text className="text-muted mb-2 text-sm">{t('appearance.theme')}</Text>
        <RadioGroup value={preference} onValueChange={onThemeChange}>
          <RadioGroup.Item value="system">
            <Label>{t('appearance.themeSystem')}</Label>
            <Radio />
          </RadioGroup.Item>
          <RadioGroup.Item value="light">
            <Label>{t('appearance.themeLight')}</Label>
            <Radio />
          </RadioGroup.Item>
          <RadioGroup.Item value="dark">
            <Label>{t('appearance.themeDark')}</Label>
            <Radio />
          </RadioGroup.Item>
        </RadioGroup>
      </View>

      <View>
        <Text className="text-muted mb-2 text-sm">{t('appearance.language')}</Text>
        <RadioGroup value={locale} onValueChange={onLocaleChange}>
          <RadioGroup.Item value="en">
            <Label>{t('appearance.langEnglish')}</Label>
            <Radio />
          </RadioGroup.Item>
          <RadioGroup.Item value="nl">
            <Label>{t('appearance.langNederlands')}</Label>
            <Radio />
          </RadioGroup.Item>
        </RadioGroup>
      </View>
    </View>
  );
}
