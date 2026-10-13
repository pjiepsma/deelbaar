import Constants from 'expo-constants';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, PressableFeedback } from 'heroui-native';

import { useAuth } from '../../../context/AuthContext';
import { useLocale } from '../../../context/LocaleContext';
import { useThemePreference } from '../../../context/ThemePreferenceContext';
import { fetchMyListings } from '../../../lib/api/listings/fetchMyListings';
import type { CmsLegalPage } from '../../../lib/legal/cmsLegal.types';
import { AccountPath } from '../../../navigation/accountPaths';
import {
  navigateToAccountListingNew,
  navigateToAccountListings,
  navigateToAccountPath,
  navigateToLegalDocument,
} from '../../../navigation/rootNavigation';
import { tabScreenBottomPadding } from '../../../navigation/tabBarClearance';
import type { MapPlaceRecord } from '../../map/map.types';
import { getHostAttestationComplete } from '../hostAttestation.storage';
import { AccountActionDeck } from './AccountActionDeck';
import { SessionSheet } from './SessionSheet';
import { AccountCanvas } from '../design/AccountCanvas';
import { AccountIconRow } from '../design/AccountIconRow';
import { AccountTopChrome } from '../design/AccountTopChrome';
import { AboutSheet } from '../design/AboutSheet';
import { PassportCard } from '../design/PassportCard';
import { TestId } from '../../../testing/testIds';
import { ACCOUNT_BLOCK_GAP, ACCOUNT_CARD_RADIUS } from '../design/accountTheme';

function resolveReachTier(user: NonNullable<ReturnType<typeof useAuth>['user']>): 1 | 2 | 3 | 4 {
  const access = user.searchAccess;
  if (access?.world) return 4;
  if (access?.country) return 3;
  if (access?.province) return 2;
  return 1;
}

export function AccountConsoleScreen() {
  const { user, refreshUser } = useAuth();
  const { t, locale } = useLocale();
  const { preference } = useThemePreference();
  const insets = useSafeAreaInsets();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [listings, setListings] = useState<MapPlaceRecord[] | null>(null);
  const [attested, setAttested] = useState(false);

  const scrollBottomPad = tabScreenBottomPadding(true, insets.bottom) + ACCOUNT_BLOCK_GAP;

  useFocusEffect(
    useCallback(() => {
      void refreshUser();
      if (!user) return;
      void fetchMyListings(user.id)
        .then(setListings)
        .catch(() => setListings(null));
      void getHostAttestationComplete(user.id).then(setAttested);
    }, [refreshUser, user]),
  );

  if (!user) return null;

  const reachTier = resolveReachTier(user);
  const appVersion = Constants.expoConfig?.version ?? Constants.nativeAppVersion;
  const themeLabelKey =
    preference === 'system'
      ? 'account.prefs.themeSystem'
      : preference === 'light'
        ? 'account.prefs.themeLight'
        : 'account.prefs.themeDark';
  const themeValue = t(themeLabelKey);
  const languageValue = locale === 'nl' ? 'Nederlands' : 'English';

  const openLegal = (page: CmsLegalPage): void => {
    navigateToLegalDocument({ page });
  };

  return (
    <AccountCanvas withTabBar showGlow={false}>
      <AccountTopChrome
        left={<Text className="text-foreground text-lg font-bold">{t('account.brand')}</Text>}
      />

      <ScrollView
        testID={TestId.screenAccountSigned}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 16, paddingBottom: scrollBottomPad }}
      >
        <PressableFeedback
          onPress={() => navigateToAccountPath(AccountPath.profile)}
          accessibilityLabel={t('account.passport.editA11y')}
        >
          <PassportCard user={user} reachTier={reachTier} />
        </PressableFeedback>

        <AccountActionDeck user={user} listings={listings} attested={attested} />

        <Card style={{ borderRadius: ACCOUNT_CARD_RADIUS }}>
          <Card.Body className="gap-2">
            <Card.Title>{t('account.console.hostTitle')}</Card.Title>
            <Card.Description>{t('account.console.hostBody')}</Card.Description>
          </Card.Body>
          <Card.Footer className="flex-row flex-wrap gap-2">
            <Button variant="primary" onPress={() => navigateToAccountListings()}>
              <Button.Label>{t('account.console.hostManage')}</Button.Label>
            </Button>
            <Button variant="secondary" onPress={() => navigateToAccountListingNew()}>
              <Button.Label>{t('account.console.hostAdd')}</Button.Label>
            </Button>
          </Card.Footer>
        </Card>

        <View style={{ gap: 4 }}>
          <Text className="text-muted text-xs font-semibold uppercase tracking-wide">
            {t('account.console.visitorTitle')}
          </Text>
          <AccountIconRow
            icon="notifications-outline"
            label={t('account.tiles.alerts')}
            onPress={() => navigateToAccountPath(AccountPath.notificationSettings)}
          />
          <AccountIconRow
            icon="home-outline"
            label={t('account.tiles.homeBase')}
            onPress={() => navigateToAccountPath(AccountPath.homeArea)}
          />
          <AccountIconRow
            icon="globe-outline"
            label={t('account.tiles.reach')}
            onPress={() => navigateToAccountPath(AccountPath.reach)}
          />
        </View>

        <View style={{ gap: 4 }}>
          <Text className="text-muted text-xs font-semibold uppercase tracking-wide">
            {t('account.console.moreTitle')}
          </Text>
          <AccountIconRow
            icon="book-outline"
            label={t('account.tiles.rules')}
            onPress={() => navigateToAccountPath(AccountPath.guidelines)}
          />
          <AccountIconRow
            icon="person-outline"
            label={t('account.tiles.identity')}
            onPress={() => navigateToAccountPath(AccountPath.profile)}
          />
          <AccountIconRow
            icon="lock-closed-outline"
            label={t('account.console.data')}
            onPress={() => navigateToAccountPath(AccountPath.data)}
          />
        </View>

        <View style={{ gap: 4 }}>
          <Text className="text-muted text-xs font-semibold uppercase tracking-wide">
            {t('account.console.settingsTitle')}
          </Text>
          <AccountIconRow
            icon="navigate-outline"
            label={t('account.guest.locationServices')}
            onPress={() => navigateToAccountPath(AccountPath.location)}
          />
          <AccountIconRow
            icon="language-outline"
            label={t('account.guest.language')}
            value={languageValue}
            onPress={() => navigateToAccountPath(AccountPath.language)}
          />
          <AccountIconRow
            icon="moon-outline"
            label={t('account.guest.theme')}
            value={themeValue}
            onPress={() => navigateToAccountPath(AccountPath.theme)}
          />
        </View>

        <View style={{ gap: 4 }}>
          <Text className="text-muted text-xs font-semibold uppercase tracking-wide">
            {t('account.console.linksTitle')}
          </Text>
          <AccountIconRow
            icon="document-text-outline"
            label={t('account.guest.terms')}
            onPress={() => openLegal('terms')}
          />
          <AccountIconRow
            icon="shield-checkmark-outline"
            label={t('account.guest.privacy')}
            onPress={() => openLegal('privacy')}
          />
          <AccountIconRow
            icon="information-circle-outline"
            label={t('account.guest.about')}
            onPress={() => setAboutOpen(true)}
          />
        </View>

        <Button variant="ghost" onPress={() => setSessionOpen(true)} className="self-start">
          <Button.Label>{t('account.console.sessionCta')}</Button.Label>
        </Button>

        {appVersion ? (
          <Text className="text-muted text-xs">{t('account.session.version', { version: String(appVersion) })}</Text>
        ) : null}
      </ScrollView>

      <AboutSheet isOpen={aboutOpen} onOpenChange={setAboutOpen} />
      <SessionSheet isOpen={sessionOpen} onOpenChange={setSessionOpen} />
    </AccountCanvas>
  );
}
