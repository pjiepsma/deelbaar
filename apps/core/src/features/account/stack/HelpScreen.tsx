import { Accordion } from 'heroui-native';
import { Text, View } from 'react-native';

import { useLocale } from '../../../context/LocaleContext';
import { TestId } from '../../../testing/testIds';
import { AccountTaskScreen } from './AccountTaskScreen';

const HELP_TOPIC_KEYS = ['map', 'save', 'host', 'account', 'privacy'] as const;

export function HelpScreen() {
  const { t } = useLocale();

  return (
    <AccountTaskScreen
      testID={TestId.screenAccountHelp} title={t('account.help.title')} subtitle={t('account.help.subtitle')}>
      <Accordion selectionMode="single" variant="surface" className="bg-white">
        {HELP_TOPIC_KEYS.map((key) => (
          <Accordion.Item key={key} value={key}>
            <Accordion.Trigger>
              <View className="min-w-0 flex-1 flex-row items-center gap-3">
                <Text className="text-foreground flex-1 text-base font-semibold">
                  {t(`account.help.topics.${key}.title`)}
                </Text>
              </View>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content>
              <Text className="text-muted text-base">{t(`account.help.topics.${key}.body`)}</Text>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion>
    </AccountTaskScreen>
  );
}
