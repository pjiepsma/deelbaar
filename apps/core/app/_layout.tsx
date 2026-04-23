import 'react-native-reanimated';
import '../global.css';
import '../reanimated.config';
import { useLayoutEffect, type ReactNode } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HeroUINativeProvider, type HeroUINativeConfig } from 'heroui-native';
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

/**
 * HeroUI Native root config (stable reference — see Provider docs).
 * https://heroui.com/docs/native/getting-started/provider
 */
const heroUiNativeConfig: HeroUINativeConfig = {
  devInfo: { stylingPrinciples: false },
};

/** Syncs Uniwind with app theme preference (Theming + Colors). */
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

/**
 * Quick Start + Provider: GestureHandlerRootView → HeroUINativeProvider (includes SafeAreaListener → PortalHost).
 * https://heroui.com/docs/native/getting-started/quick-start
 * https://heroui.com/docs/native/getting-started/portal
 *
 * Do not wrap Stack in a second SafeAreaProvider — HeroUINativeProvider already provides safe-area context for Uniwind + useSafeAreaInsets.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider config={heroUiNativeConfig}>
        <ThemePreferenceProvider>
          <Shell>
            <QueryProvider>
              <AuthProvider>
                <UserProvider>
                  <LocalePreferenceProvider>
                    <OnboardingProvider>
                      <NotificationProvider>
                        <Stack screenOptions={{ headerShown: false }}>
                          <Stack.Screen name="index" />
                          <Stack.Screen name="login" />
                          <Stack.Screen name="(tabs)" />
                          <Stack.Screen
                            name="(modals)"
                            options={{
                              presentation: 'modal',
                              headerShown: false,
                            }}
                          />
                        </Stack>
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
