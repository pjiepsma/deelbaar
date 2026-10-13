import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { ListGroup, PressableFeedback, Separator, useThemeColor } from 'heroui-native';

import { useLocale, type AppLocale } from '../../../context/LocaleContext';
import { TestId } from '../../../testing/testIds';
import { AccountTaskScreen } from './AccountTaskScreen';

const LANG_OPTIONS: ReadonlyArray<{ value: AppLocale; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'nl', label: 'Nederlands' },
];

export function LanguageScreen() {
  const router = useRouter();
  const { t, locale, setLocale } = useLocale();
  const accent = useThemeColor('accent');

  const onSelect = (value: AppLocale): void => {
    void setLocale(value);
    router.back();
  };

  return (
    <AccountTaskScreen testID={TestId.screenAccountLanguage} title={t('account.prefs.language')}>
      <ListGroup>
        {LANG_OPTIONS.map((opt, index) => (
          <View key={opt.value}>
            {index > 0 ? <Separator className="mx-4" /> : null}
            <PressableFeedback
              accessibilityRole="button"
              accessibilityState={{ selected: locale === opt.value }}
              onPress={() => onSelect(opt.value)}
            >
              <ListGroup.Item disabled>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{opt.label}</ListGroup.ItemTitle>
                </ListGroup.ItemContent>
                {locale === opt.value ? (
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
