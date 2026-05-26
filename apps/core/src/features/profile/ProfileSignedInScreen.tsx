import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Fragment, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Avatar, Button, ListGroup, Separator, useThemeColor } from 'heroui-native';

import { Screen, SectionHeader, TabScreenHeader } from '../../components/shared';
import {
  TAB_SCREEN_CONTENT_BOTTOM_PADDING,
  TAB_SCREEN_HEADER_TOP_GAP,
  TAB_SCREEN_HORIZONTAL_PADDING,
  TAB_SCREEN_SECTION_GAP,
} from '../../components/shared/tab-screen.constants';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import type { Messages } from '../../i18n/catalog';
import type { AuthUser } from '../../lib/api/auth/authClient';
import { AppearancePreferencesSection } from '../preferences/AppearancePreferencesSection';
import { PROFILE_BLOCK_GAP } from './profile.constants';
import { ProfileLegalSection } from './ProfileLegalSection';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type SettingsRowKey = keyof Messages['profile']['settingsRows'];

const PROFILE_SETTINGS_ROWS: ReadonlyArray<{ labelKey: SettingsRowKey; icon: IoniconName }> = [
  { labelKey: 'personalInformation', icon: 'person-outline' },
  { labelKey: 'paymentsAndPayouts', icon: 'wallet-outline' },
  { labelKey: 'taxes', icon: 'document-text-outline' },
  { labelKey: 'loginAndSecurity', icon: 'shield-checkmark-outline' },
  { labelKey: 'accessibility', icon: 'accessibility-outline' },
];

function displayName(user: AuthUser): string {
  const nameParts = [user.name?.trim(), user.surname?.trim()].filter((part): part is string => Boolean(part));
  if (nameParts.length > 0) {
    return nameParts.join(' ');
  }
  const email = user.email.trim();
  if (!email) {
    throw new Error('AuthUser has no displayable name or email');
  }
  return email;
}

function initials(user: AuthUser): string {
  const parts: string[] = [];
  const given = user.name?.trim();
  const family = user.surname?.trim();
  if (given && given.length > 0) {
    parts.push(given.charAt(0));
  }
  if (family && family.length > 0) {
    parts.push(family.charAt(0));
  }
  if (parts.length > 0) {
    return parts.join('').toUpperCase().slice(0, 2);
  }
  const email = user.email.trim();
  if (!email) {
    throw new Error('AuthUser has no email for initials');
  }
  return email.charAt(0).toUpperCase();
}

export function ProfileSignedInScreen() {
  const { user, signOut } = useAuth();
  const { t } = useLocale();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [foreground, muted] = useThemeColor(['foreground', 'muted']);

  const onLogout = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      await signOut();
    } finally {
      setIsSubmitting(false);
    }
  };

  const settingsRowPress = (): void => undefined;

  if (!user) {
    return null;
  }

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
        <TabScreenHeader title={t('profile.title')} />

        <View style={{ gap: PROFILE_BLOCK_GAP }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profile.showProfile')}
            onPress={settingsRowPress}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <View className="flex-row items-center" style={{ gap: 14 }}>
              <Avatar size="lg" color="accent" variant="soft" alt={displayName(user)}>
                <Avatar.Fallback>{initials(user)}</Avatar.Fallback>
              </Avatar>
              <View className="min-w-0 flex-1" style={{ gap: 2 }}>
                <Text className="text-foreground text-xl font-bold">{displayName(user)}</Text>
                <Text className="text-base text-muted">{t('profile.showProfile')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={muted} />
            </View>
          </Pressable>
        </View>

        <View>
          <SectionHeader title={t('profile.settings')} />
          <ListGroup>
            {PROFILE_SETTINGS_ROWS.map((row, index) => (
              <Fragment key={row.labelKey}>
                {index > 0 ? <Separator className="mx-4" /> : null}
                <ListGroup.Item onPress={settingsRowPress}>
                  <ListGroup.ItemPrefix>
                    <Ionicons name={row.icon} size={22} color={foreground} />
                  </ListGroup.ItemPrefix>
                  <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>{t(`profile.settingsRows.${row.labelKey}`)}</ListGroup.ItemTitle>
                  </ListGroup.ItemContent>
                  <ListGroup.ItemSuffix iconProps={{ size: 18, color: muted }} />
                </ListGroup.Item>
              </Fragment>
            ))}
          </ListGroup>
        </View>

        <AppearancePreferencesSection splitSections />

        <ProfileLegalSection />

        <Button variant="danger" onPress={onLogout} isDisabled={isSubmitting} className="self-start">
          {isSubmitting ? t('profile.loggingOut') : t('profile.logout')}
        </Button>
      </ScrollView>
    </Screen>
  );
}
