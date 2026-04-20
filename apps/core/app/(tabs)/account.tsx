import { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from 'heroui-native/button';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppColors } from '~/lib/theme';
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
  const colors = useAppColors();
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
  }, [profile?.email, profile?.name]);
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
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 12, paddingBottom: Math.max(20, insets.bottom + 12) },
      ]}>
      <View style={[styles.card, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.title, { color: colors.text.primary }]}>{t('accountTab.title')}</Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          {t('accountTab.signedInAs')}: {displayName}
        </Text>
        <View style={[styles.badge, { backgroundColor: colors.background.tertiary }]}>
          <Text style={[styles.badgeText, { color: colors.text.secondary }]}>
            {t('accountTab.role')}: {accountRole}
          </Text>
        </View>
        <Text style={[styles.meta, { color: colors.text.tertiary }]}>
          {t('accountTab.email')}: {profile?.email || t('accountTab.notSignedIn')}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{t('accountTab.themeTitle')}</Text>
        <Text style={[styles.sectionHelp, { color: colors.text.tertiary }]}>
          {t('accountTab.themeHelp')}
        </Text>
        <View style={styles.row}>
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
      </View>

      <View style={[styles.card, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          {t('accountTab.languageTitle')}
        </Text>
        <Text style={[styles.sectionHelp, { color: colors.text.tertiary }]}>
          {t('accountTab.languageHelp')}
        </Text>
        <View style={styles.row}>
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
      </View>

      <View style={[styles.card, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          {t('accountTab.appActionsTitle')}
        </Text>
        <Text style={[styles.sectionHelp, { color: colors.text.tertiary }]}>
          {t('accountTab.appActionsHelp')}
        </Text>
        <View style={styles.actions}>
          <Button variant="secondary" onPress={startOnboarding}>
            {t('accountTab.replayOnboarding')}
          </Button>
          <Button variant="secondary" onPress={() => router.push('/(tabs)')}>
            {t('accountTab.goToMap')}
          </Button>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          {t('accountTab.sessionTitle')}
        </Text>
        <Text style={[styles.sectionHelp, { color: colors.text.tertiary }]}>
          {t('accountTab.sessionHelp')}
        </Text>
        <View style={styles.actions}>
          {!user ? (
            <Button onPress={() => router.push('/login')}>{t('accountTab.signIn')}</Button>
          ) : (
            <Button color="danger" variant="secondary" onPress={handleSignOut}>
              {t('accountTab.signOut')}
            </Button>
          )}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          {t('accountTab.diagnosticsTitle')}
        </Text>
        <Text style={[styles.meta, { color: colors.text.tertiary }]}>
          {t('accountTab.diagnosticsAuthStatus')}: {user ? t('accountTab.authIn') : t('accountTab.authOut')}
        </Text>
        <Text style={[styles.meta, { color: colors.text.tertiary }]}>
          {t('accountTab.diagnosticsThemeActive')}: {resolvedTheme}
        </Text>
        <Text style={[styles.meta, { color: colors.text.tertiary }]}>
          {t('accountTab.diagnosticsThemePref')}: {themePreference}
        </Text>
        <Text style={[styles.meta, { color: colors.text.tertiary }]}>
          {t('accountTab.diagnosticsLanguageActive')}: {resolvedLocale}
        </Text>
        <Text style={[styles.meta, { color: colors.text.tertiary }]}>
          {t('accountTab.diagnosticsLanguagePref')}: {localePreference}
        </Text>
      </View>

      {isLoading ? (
        <Text style={[styles.loadingText, { color: colors.text.tertiary }]}>{t('accountTab.loading')}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
  },
  meta: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHelp: {
    fontSize: 13,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actions: {
    gap: 10,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 6,
    marginBottom: 12,
  },
});
