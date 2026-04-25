import { HeroUINativeProvider } from 'heroui-native';
import type { PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { payloadClient } from '../../lib/api/PayloadClient';

const PAYLOAD_SERVER_URL = process.env.EXPO_PUBLIC_PAYLOAD_SERVER_URL;

if (!PAYLOAD_SERVER_URL) {
  throw new Error('Missing EXPO_PUBLIC_PAYLOAD_SERVER_URL in apps/core/.env');
}

payloadClient.init({ serverURL: PAYLOAD_SERVER_URL });

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>{children}</HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
