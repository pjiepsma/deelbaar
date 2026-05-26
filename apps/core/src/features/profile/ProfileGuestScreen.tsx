import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Surface, useThemeColor } from 'heroui-native';

import {
  GuestAuthCard,
  Screen,
  SectionHeader,
  TAB_SCREEN_CONTENT_BOTTOM_PADDING,
  TAB_SCREEN_HORIZONTAL_PADDING,
  TabScreenHeader,
} from '../../components/shared';
import { useLocale } from '../../context/LocaleContext';
import { navigateToAuthStart } from '../../navigation/rootNavigation';
import {
  LanguagePreferenceControl,
  ThemePreferenceControl,
} from '../preferences/AppearancePreferencesSection';
import {
  PROFILE_GUEST_HEADER_TOP_GAP,
  PROFILE_GUEST_SECTION_GAP,
} from './profile.constants';
import { ProfileLegalSection } from './ProfileLegalSection';

export function ProfileGuestScreen() {
  const { t } = useLocale();
  const muted = useThemeColor('muted');

  return (
    <Screen withTabBarSpacing horizontalPadding={TAB_SCREEN_HORIZONTAL_PADDING}>
      <View
        className="flex-1"
        style={{
          paddingTop: PROFILE_GUEST_HEADER_TOP_GAP,
          gap: PROFILE_GUEST_SECTION_GAP,
          paddingBottom: TAB_SCREEN_CONTENT_BOTTOM_PADDING,
        }}
      >
        <TabScreenHeader title={t('profile.title')} subtitle={t('profile.guestSubtitle')} compact />

        <GuestAuthCard
          compact
          icon={<Ionicons name="person-circle-outline" size={24} color={muted} />}
          headline={t('profile.guestSignInTitle')}
          description={t('profile.guestSignInDescription')}
          ctaLabel={t('auth.loginOrSignUp')}
          onPress={() => navigateToAuthStart()}
        />

        <View>
          <SectionHeader title={t('appearance.theme')} compact />
          <Surface className="rounded-2xl p-3">
            <ThemePreferenceControl compact horizontal />
          </Surface>
        </View>

        <View>
          <SectionHeader title={t('appearance.language')} compact />
          <Surface className="rounded-2xl p-3">
            <LanguagePreferenceControl compact horizontal />
          </Surface>
        </View>

        <ProfileLegalSection compact />
      </View>
    </Screen>
  );
}
