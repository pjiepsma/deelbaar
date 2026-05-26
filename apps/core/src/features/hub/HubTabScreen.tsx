import { ScrollView, Text } from 'react-native';

import {
  Screen,
  TAB_SCREEN_CONTENT_BOTTOM_PADDING,
  TAB_SCREEN_HEADER_TOP_GAP,
  TAB_SCREEN_HORIZONTAL_PADDING,
  TAB_SCREEN_SECTION_GAP,
  TabScreenHeader,
} from '../../components/shared';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { HubGuestScreen } from './HubGuestScreen';
import { MyListingsSection } from '../profile/MyListingsSection';

const PAYLOAD_SERVER_ORIGIN = process.env.EXPO_PUBLIC_PAYLOAD_SERVER_URL;

export function HubTabScreen() {
  const { user } = useAuth();
  const { t } = useLocale();

  if (!user) {
    return <HubGuestScreen />;
  }

  return (
    <Screen withTabBarSpacing horizontalPadding={TAB_SCREEN_HORIZONTAL_PADDING}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: TAB_SCREEN_HEADER_TOP_GAP,
          gap: TAB_SCREEN_SECTION_GAP,
          paddingBottom: TAB_SCREEN_CONTENT_BOTTOM_PADDING,
        }}
      >
        <TabScreenHeader title={t('hub.title')} subtitle={t('hub.subtitle')} />

        {PAYLOAD_SERVER_ORIGIN ? (
          <MyListingsSection ownerId={user.id} serverOrigin={PAYLOAD_SERVER_ORIGIN} />
        ) : (
          <Text className="text-muted text-base">{t('hub.missingEnv')}</Text>
        )}
      </ScrollView>
    </Screen>
  );
}
