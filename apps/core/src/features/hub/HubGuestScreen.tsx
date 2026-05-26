import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from 'heroui-native';
import { ScrollView } from 'react-native';

import {
  GuestAuthCard,
  Screen,
  TAB_SCREEN_CONTENT_BOTTOM_PADDING,
  TAB_SCREEN_HEADER_TOP_GAP,
  TAB_SCREEN_HORIZONTAL_PADDING,
  TAB_SCREEN_SECTION_GAP,
  TabScreenHeader,
} from '../../components/shared';
import { useLocale } from '../../context/LocaleContext';
import { navigateToAuthStart } from '../../navigation/rootNavigation';

export function HubGuestScreen() {
  const { t } = useLocale();
  const muted = useThemeColor('muted');

  return (
    <Screen withTabBarSpacing horizontalPadding={TAB_SCREEN_HORIZONTAL_PADDING}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: TAB_SCREEN_HEADER_TOP_GAP,
          gap: TAB_SCREEN_SECTION_GAP,
          paddingBottom: TAB_SCREEN_CONTENT_BOTTOM_PADDING,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <TabScreenHeader title={t('hub.title')} subtitle={t('hub.subtitle')} />

        <GuestAuthCard
          icon={<Ionicons name="albums-outline" size={28} color={muted} />}
          headline={t('hub.guestSignInTitle')}
          description={t('hub.guestSignInDescription')}
          ctaLabel={t('auth.loginOrSignUp')}
          onPress={() => navigateToAuthStart()}
        />
      </ScrollView>
    </Screen>
  );
}
