import { useMemo } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Chip } from 'heroui-native/chip';
import { Separator } from 'heroui-native/separator';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '~/lib/providers/AuthProvider';
import { useLocalePreference } from '~/lib/providers/LocalePreferenceProvider';
import { useOnboarding } from '~/lib/providers/OnboardingProvider';
import {
  type ThemePreference,
  useThemePreference,
} from '~/lib/providers/ThemePreferenceProvider';
import { useUser } from '~/lib/providers/UserProvider';

const THEME_OPTIONS: ThemePreference[] = ['system', 'light', 'dark'];
const LOCALE_OPTIONS = ['nl', 'en'] as const;

export default function AccountTabScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut, isLoading } = useAuth();
  const { profile } = useUser();
  const { preference: themePreference, resolvedTheme, setPreference: setThemePreference } =
    useThemePreference();
  const { preference: localePreference, resolvedLocale, setPreference: setLocalePreference } =
    useLocalePreference();
  const { startOnboarding } = useOnboarding();

  const displayName = useMemo(() => {
    if (profile?.name) return profile.name;
    if (profile?.email) return profile.email;
    return t('accountTab.roleGuest');
  }, [profile?.email, profile?.name, t]);

  const accountRole = profile?.role || (user ? t('accountTab.roleMember') : t('accountTab.roleGuest'));

  const handleSignOut = () => {
    Alert.alert(t('accountTab.confirmSignOutTitle'), t('accountTab.confirmSignOutBody'), [
      { text: t('accountTab.cancel'), style: 'cancel' },
      {
        text: t('accountTab.signOut'),
        style: 'destructive',
        onPress: () => {
          void signOut();
        },
      },
    ]);
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: Math.max(20, insets.bottom + 12),
        paddingHorizontal: 16,
        gap: 12,
      }}>
      <Card>
        <Card.Header className="gap-1">
          <Card.Title>{t('accountTab.title')}</Card.Title>
          <Card.Description>
            {t('accountTab.signedInAs')}: {displayName}
          </Card.Description>
        </Card.Header>
        <Card.Body className="gap-2">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="text-sm text-muted">{t('accountTab.role')}:</Text>
            <Chip color="default" size="sm" variant="soft">
              {accountRole}
            </Chip>
          </View>
          <Text className="text-sm text-muted">
            {t('accountTab.email')}: {profile?.email || t('accountTab.notSignedIn')}
          </Text>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>{t('accountTab.themeTitle')}</Card.Title>
          <Card.Description>{t('accountTab.themeHelp')}</Card.Description>
        </Card.Header>
        <Card.Body className="gap-2">
          <View className="flex-row flex-wrap gap-2">
            {THEME_OPTIONS.map((option) => (
              <Button
                key={option}
                size="sm"
                variant={themePreference === option ? 'solid' : 'secondary'}
                onPress={() => setThemePreference(option)}>
                {option}
              </Button>
            ))}
          </View>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>{t('accountTab.languageTitle')}</Card.Title>
          <Card.Description>{t('accountTab.languageHelp')}</Card.Description>
        </Card.Header>
        <Card.Body className="gap-2">
          <View className="flex-row flex-wrap gap-2">
            {LOCALE_OPTIONS.map((option) => (
              <Button
                key={option}
                size="sm"
                variant={localePreference === option ? 'solid' : 'secondary'}
                onPress={() => setLocalePreference(option)}>
                {option}
              </Button>
            ))}
          </View>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>{t('accountTab.appActionsTitle')}</Card.Title>
          <Card.Description>{t('accountTab.appActionsHelp')}</Card.Description>
        </Card.Header>
        <Card.Body className="gap-3">
          <Button variant="secondary" onPress={startOnboarding}>
            {t('accountTab.replayOnboarding')}
          </Button>
          <Separator />
          <Button variant="secondary" onPress={() => router.push('/(tabs)')}>
            {t('accountTab.goToMap')}
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>{t('accountTab.sessionTitle')}</Card.Title>
          <Card.Description>{t('accountTab.sessionHelp')}</Card.Description>
        </Card.Header>
        <Card.Body>
          {!user ? (
            <Button onPress={() => router.push('/login')}>{t('accountTab.signIn')}</Button>
          ) : (
            <Button color="danger" variant="secondary" onPress={handleSignOut}>
              {t('accountTab.signOut')}
            </Button>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>{t('accountTab.diagnosticsTitle')}</Card.Title>
        </Card.Header>
        <Card.Body className="gap-1">
          <Text className="text-sm text-muted">
            {t('accountTab.diagnosticsAuthStatus')}:{' '}
            {user ? t('accountTab.authIn') : t('accountTab.authOut')}
          </Text>
          <Text className="text-sm text-muted">
            {t('accountTab.diagnosticsThemeActive')}: {resolvedTheme}
          </Text>
          <Text className="text-sm text-muted">
            {t('accountTab.diagnosticsThemePref')}: {themePreference}
          </Text>
          <Text className="text-sm text-muted">
            {t('accountTab.diagnosticsLanguageActive')}: {resolvedLocale}
          </Text>
          <Text className="text-sm text-muted">
            {t('accountTab.diagnosticsLanguagePref')}: {localePreference}
          </Text>
        </Card.Body>
      </Card>

      {isLoading ? (
        <Text className="text-center text-sm text-muted">{t('accountTab.loading')}</Text>
      ) : null}
    </ScrollView>
  );
}
