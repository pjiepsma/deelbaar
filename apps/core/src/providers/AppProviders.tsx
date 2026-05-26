import { HeroUINativeProvider } from 'heroui-native';
import type { PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '../context/AuthContext';
import { DiscoveryAreaProvider } from '../context/DiscoveryAreaContext';
import { LocaleProvider } from '../context/LocaleContext';
import { ThemePreferenceProvider } from '../context/ThemePreferenceContext';
import { payloadClient } from '../lib/api/PayloadClient';

const PAYLOAD_SERVER_URL = process.env.EXPO_PUBLIC_PAYLOAD_SERVER_URL;

if (!PAYLOAD_SERVER_URL) {
  throw new Error('Missing EXPO_PUBLIC_PAYLOAD_SERVER_URL in apps/core/.env');
}

payloadClient.init({ serverURL: PAYLOAD_SERVER_URL });

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <HeroUINativeProvider>
            <ThemePreferenceProvider>
              <LocaleProvider>
                <AuthProvider>
                  <DiscoveryAreaProvider>{children}</DiscoveryAreaProvider>
                </AuthProvider>
              </LocaleProvider>
            </ThemePreferenceProvider>
          </HeroUINativeProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
