import 'react-native-reanimated';
import '../global.css';
import '../reanimated.config';
import { useLayoutEffect, type ReactNode } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HeroUINativeProvider } from 'heroui-native/provider';
import { Uniwind } from 'uniwind';
import '~/lib/i18n/i18n';
import { AuthProvider } from '~/lib/providers/AuthProvider';
import { LocalePreferenceProvider } from '~/lib/providers/LocalePreferenceProvider';
import { NotificationProvider } from '~/lib/providers/NotificationProvider';
import { OnboardingProvider } from '~/lib/providers/OnboardingProvider';
import { QueryProvider } from '~/lib/providers/QueryProvider';
import {
  ThemePreferenceProvider,
  useThemePreference,
} from '~/lib/providers/ThemePreferenceProvider';
import { UserProvider } from '~/lib/providers/UserProvider';

/** Default Expo + HeroUI Native + Uniwind — nothing else. */
function Shell({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useThemePreference();

  useLayoutEffect(() => {
    Uniwind.setTheme(resolvedTheme);
  }, [resolvedTheme]);

  return (
    <>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      {children}
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
        <ThemePreferenceProvider>
          <Shell>
            <QueryProvider>
              <AuthProvider>
                <UserProvider>
                  <LocalePreferenceProvider>
                    <OnboardingProvider>
                      <NotificationProvider>
                        <SafeAreaProvider>
                          <Stack screenOptions={{ headerShown: false }} />
                        </SafeAreaProvider>
                      </NotificationProvider>
                    </OnboardingProvider>
                  </LocalePreferenceProvider>
                </UserProvider>
              </AuthProvider>
            </QueryProvider>
          </Shell>
        </ThemePreferenceProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
