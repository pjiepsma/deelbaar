import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { Button, ListGroup, PressableFeedback, Separator, useThemeColor } from 'heroui-native';

import { DoodleImage } from '../../../branding/DoodleImage';
import {
  BRAND_HELP_WASH,
  BRAND_HELP_WASH_CLASS,
  BRAND_INVITE_WASH,
  BRAND_INVITE_WASH_CLASS,
} from '../../../branding/colors';
import {
  HELP_CARD_DOODLE,
  HELP_CARD_DOODLE_SIZE,
  JOIN_CARD_DOODLE,
  JOIN_CARD_DOODLE_SIZE,
} from '../../../branding/doodles';
import { SoftCtaButton } from '../../../components/shared';
import { useLocale } from '../../../context/LocaleContext';
import { useThemePreference } from '../../../context/ThemePreferenceContext';
import { AccountPath } from '../../../navigation/accountPaths';
import { AuthPath } from '../../../navigation/authPaths';
import { TestId } from '../../../testing/testIds';
import {
  navigateToAccountPath,
  navigateToLegalDocument,
} from '../../../navigation/rootNavigation';
import { tabScreenBottomPadding } from '../../../navigation/tabBarClearance';
import { AccountCanvas } from '../design/AccountCanvas';
import { AccountPromoCard } from '../design/AccountPromoCard';
import { AccountSectionTitle } from '../design/AccountSectionTitle';
import { AccountTopChrome } from '../design/AccountTopChrome';
import { AboutSheet } from '../design/AboutSheet';
import {
  ACCOUNT_BLOCK_GAP,
  ACCOUNT_SECTION_GAP,
  ACCOUNT_TITLE_CLASS,
} from '../design/accountTheme';

const JOIN_PERK_KEYS = [
  'account.guest.perkSave',
  'account.guest.perkAlerts',
  'account.guest.perkHost',
] as const;

const LIST_GROUP_CLASS = 'bg-white shadow-none';

async function locationServicesOn(): Promise<boolean> {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    return false;
  }
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === Location.PermissionStatus.GRANTED;
}

type SettingsRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  onPress: () => void;
  iconColor: string;
};

function SettingsRow({ icon, title, description, onPress, iconColor }: SettingsRowProps) {
  return (
    <PressableFeedback accessibilityRole="button" accessibilityLabel={title} onPress={onPress}>
      <ListGroup.Item disabled>
        <ListGroup.ItemPrefix>
          <Ionicons name={icon} size={22} color={iconColor} />
        </ListGroup.ItemPrefix>
        <ListGroup.ItemContent>
          <ListGroup.ItemTitle>{title}</ListGroup.ItemTitle>
          {description ? (
            <ListGroup.ItemDescription>{description}</ListGroup.ItemDescription>
          ) : null}
        </ListGroup.ItemContent>
      </ListGroup.Item>
    </PressableFeedback>
  );
}

export function GuestAccountScreen() {
  const { t, locale } = useLocale();
  const { preference } = useThemePreference();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [accent] = useThemeColor(['accent']);
  const [foreground] = useThemeColor(['foreground']);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [locationOn, setLocationOn] = useState<boolean | null>(null);

  const scrollBottomPad = tabScreenBottomPadding(true, insets.bottom) + ACCOUNT_BLOCK_GAP;

  const appVersion = Constants.expoConfig?.version ?? Constants.nativeAppVersion;
  const themeLabelKey =
    preference === 'system'
      ? 'account.prefs.themeSystem'
      : preference === 'light'
        ? 'account.prefs.themeLight'
        : 'account.prefs.themeDark';
  const themeValue = t(themeLabelKey);
  const languageValue = locale === 'nl' ? 'Nederlands' : 'English';
  const locationValue =
    locationOn === null
      ? undefined
      : locationOn
        ? t('account.guest.locationOn')
        : t('account.guest.locationOff');

  useFocusEffect(
    useCallback(() => {
      void locationServicesOn().then(setLocationOn);
    }, []),
  );

  const openAuth = () => {
    router.push(AuthPath.start);
  };

  return (
    <AccountCanvas withTabBar showGlow={false}>
      <AccountTopChrome
        left={<Text className={ACCOUNT_TITLE_CLASS}>{t('account.brand')}</Text>}
      />

      <ScrollView
        testID={TestId.screenAccountGuest}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: ACCOUNT_BLOCK_GAP, paddingBottom: scrollBottomPad }}
      >
        <AccountPromoCard
          title={t('account.guest.joinTitle')}
          washColor={BRAND_INVITE_WASH}
          washClassName={BRAND_INVITE_WASH_CLASS}
          art={
            <DoodleImage
              id={JOIN_CARD_DOODLE}
              size={JOIN_CARD_DOODLE_SIZE}
              accessibilityLabel={t('account.guest.joinArtA11y')}
            />
          }
          body={
            <View className="gap-1">
              {JOIN_PERK_KEYS.map((key) => (
                <View key={key} className="flex-row items-center gap-2">
                  <Ionicons name="checkmark-circle" size={16} color={accent} />
                  <Text className="text-muted text-sm flex-1" numberOfLines={1}>
                    {t(key)}
                  </Text>
                </View>
              ))}
            </View>
          }
          footer={
            <View className="w-full flex-row gap-2">
              <SoftCtaButton
                testID={TestId.btnAccountSignUp}
                className="flex-1"
                onPress={openAuth}
                label={t('account.guest.createAccount')}
              />
              <Button
                testID={TestId.btnAccountLogin}
                variant="primary"
                className="flex-1"
                onPress={openAuth}
              >
                <Button.Label>{t('account.guest.logIn')}</Button.Label>
              </Button>
            </View>
          }
        />

        <AccountPromoCard
          title={t('account.guest.needHelpTitle')}
          subtitle={t('account.guest.needHelpBody')}
          washColor={BRAND_HELP_WASH}
          washClassName={BRAND_HELP_WASH_CLASS}
          accessibilityLabel={t('account.guest.needHelpTitle')}
          onPress={() => navigateToAccountPath(AccountPath.help)}
          showChevron
          compact
          art={
            <DoodleImage
              id={HELP_CARD_DOODLE}
              size={HELP_CARD_DOODLE_SIZE}
              accessibilityLabel={t('account.guest.needHelpArtA11y')}
            />
          }
        />

        <View style={{ gap: ACCOUNT_SECTION_GAP }}>
          <AccountSectionTitle>{t('account.guest.settingsTitle')}</AccountSectionTitle>
          <ListGroup className={LIST_GROUP_CLASS}>
            <SettingsRow
              icon="navigate-outline"
              title={t('account.guest.locationServices')}
              description={locationValue}
              iconColor={foreground}
              onPress={() => navigateToAccountPath(AccountPath.location)}
            />
            <Separator className="mx-4" />
            <SettingsRow
              icon="language-outline"
              title={t('account.guest.language')}
              description={languageValue}
              iconColor={foreground}
              onPress={() => navigateToAccountPath(AccountPath.language)}
            />
            <Separator className="mx-4" />
            <SettingsRow
              icon="moon-outline"
              title={t('account.guest.theme')}
              description={themeValue}
              iconColor={foreground}
              onPress={() => navigateToAccountPath(AccountPath.theme)}
            />
          </ListGroup>
        </View>

        <View style={{ gap: ACCOUNT_SECTION_GAP }}>
          <AccountSectionTitle>{t('account.guest.linksTitle')}</AccountSectionTitle>
          <ListGroup className={LIST_GROUP_CLASS}>
            <SettingsRow
              icon="book-outline"
              title={t('account.guest.guidelines')}
              iconColor={foreground}
              onPress={() => navigateToAccountPath(AccountPath.guidelines)}
            />
            <Separator className="mx-4" />
            <SettingsRow
              icon="document-text-outline"
              title={t('account.guest.terms')}
              iconColor={foreground}
              onPress={() => navigateToLegalDocument({ page: 'terms' })}
            />
            <Separator className="mx-4" />
            <SettingsRow
              icon="shield-checkmark-outline"
              title={t('account.guest.privacy')}
              iconColor={foreground}
              onPress={() => navigateToLegalDocument({ page: 'privacy' })}
            />
            <Separator className="mx-4" />
            <SettingsRow
              icon="information-circle-outline"
              title={t('account.guest.about')}
              iconColor={foreground}
              onPress={() => setAboutOpen(true)}
            />
          </ListGroup>
        </View>

        {appVersion ? (
          <Text className="text-muted text-center text-xs">
            {t('account.guest.version', { version: String(appVersion) })}
          </Text>
        ) : null}
      </ScrollView>

      <AboutSheet isOpen={aboutOpen} onOpenChange={setAboutOpen} />
    </AccountCanvas>
  );
}
