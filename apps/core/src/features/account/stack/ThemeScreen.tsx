import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { ListGroup, PressableFeedback, Separator, useThemeColor } from 'heroui-native';

import { useLocale } from '../../../context/LocaleContext';
import { useThemePreference, type ThemePreference } from '../../../context/ThemePreferenceContext';
import { TestId } from '../../../testing/testIds';
import { AccountTaskScreen } from './AccountTaskScreen';

const THEME_OPTIONS: ReadonlyArray<{
  value: ThemePreference;
  key: 'themeSystem' | 'themeLight' | 'themeDark';
}> = [
  { value: 'system', key: 'themeSystem' },
  { value: 'light', key: 'themeLight' },
  { value: 'dark', key: 'themeDark' },
];

export function ThemeScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { preference, setPreference } = useThemePreference();
  const accent = useThemeColor('accent');

  const onSelect = (value: ThemePreference): void => {
    void setPreference(value);
    router.back();
  };

  return (
    <AccountTaskScreen
      testID={TestId.screenAccountTheme} title={t('account.prefs.theme')}>
      <ListGroup>
        {THEME_OPTIONS.map((opt, index) => (
          <View key={opt.value}>
            {index > 0 ? <Separator className="mx-4" /> : null}
            <PressableFeedback
              accessibilityRole="button"
              accessibilityState={{ selected: preference === opt.value }}
              onPress={() => onSelect(opt.value)}
            >
              <ListGroup.Item disabled>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{t(`account.prefs.${opt.key}`)}</ListGroup.ItemTitle>
                </ListGroup.ItemContent>
                {preference === opt.value ? (
                  <Ionicons name="checkmark" size={22} color={accent} />
                ) : (
                  <ListGroup.ItemSuffix />
                )}
              </ListGroup.Item>
            </PressableFeedback>
          </View>
        ))}
      </ListGroup>
    </AccountTaskScreen>
  );
}
