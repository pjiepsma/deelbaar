import 'react-native-reanimated';
import { Stack } from 'expo-router';
import { QueryProvider } from '~/lib/providers/QueryProvider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '~/lib/providers/AuthProvider';
import { UserProvider } from '~/lib/providers/UserProvider';
import { NotificationProvider } from '~/lib/providers/NotificationProvider';
import { OnboardingProvider } from '~/lib/providers/OnboardingProvider';
import { useEffect } from 'react';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import config from '~/gluestack-ui.config';
import { sqliteManager } from '~/lib/storage/SQLiteManager';

export default function RootLayout() {
  useEffect(() => {
    sqliteManager
      .init()
      .catch((error) => console.error('[RootLayout] Failed to initialize SQLite', error));
  }, []);

  return (
    <QueryProvider>
      <GluestackUIProvider config={config}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <AuthProvider>
              <NotificationProvider>
                <UserProvider>
                  <OnboardingProvider>
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      <Stack.Screen
                        name="(modals)"
                        options={{ presentation: 'modal', headerShown: false }}
                      />
                    </Stack>
                  </OnboardingProvider>
                </UserProvider>
              </NotificationProvider>
            </AuthProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </GluestackUIProvider>
    </QueryProvider>
  );
}

