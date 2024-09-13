import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Session } from '@supabase/supabase-js';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider } from '~/lib/AuthProvider';
import { useSystem } from '~/lib/powersync/PowerSync';
import { PowerSyncProvider } from '~/lib/powersync/PowerSyncProvider';

const InitialLayout = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);

  const segments = useSegments();
  const router = useRouter();

  const { connector } = useSystem();
  const system = useSystem();

  useEffect(() => {
    system.init();
  }, []);

  useEffect(() => {
    // Listen for changes to authentication state
    const { data } = connector.client.auth.onAuthStateChange(async (event, session) => {
      console.log('supabase.auth.onAuthStateChange', event, session);
      setSession(session);
      setInitialized(true);
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!initialized) return;

    // Check if the path/url is in the (auth) group
    const inAuthGroup = segments[0] === '(auth)';

    if (session && !inAuthGroup) {
      // Redirect authenticated users to the list page
      router.replace('/(tabs)/');
    } else if (!session) {
      // Redirect unauthenticated users to the login page
      router.replace('/(modals)/login');
    }
  }, [session, initialized]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
};

const RootLayout = () => {
  return (
    <PowerSyncProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <AuthProvider>
            <InitialLayout />
          </AuthProvider>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </PowerSyncProvider>
  );
};

export default RootLayout;
