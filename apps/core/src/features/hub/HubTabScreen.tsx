import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { ProfileGuestAuthStack } from '../../navigation/AuthStack';
import { MyListingsSection } from '../profile/MyListingsSection';

const PAYLOAD_SERVER_ORIGIN = process.env.EXPO_PUBLIC_PAYLOAD_SERVER_URL;

const HUB_HORIZONTAL_PADDING = 16;

export function HubTabScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useLocale();

  if (!user) {
    return <ProfileGuestAuthStack />;
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: HUB_HORIZONTAL_PADDING,
        gap: 16,
      }}
    >
      <View>
        <Text className="text-foreground text-2xl font-bold">{t('hub.title')}</Text>
        <Text className="text-muted mt-2 text-base leading-6">{t('hub.subtitle')}</Text>
      </View>

      {PAYLOAD_SERVER_ORIGIN ? (
        <MyListingsSection ownerId={user.id} serverOrigin={PAYLOAD_SERVER_ORIGIN} />
      ) : (
        <Text className="text-muted">{t('hub.missingEnv')}</Text>
      )}
    </ScrollView>
  );
}
