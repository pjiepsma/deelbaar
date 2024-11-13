import Entypo from '@expo/vector-icons/Entypo';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Font from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AnimatedSplash from '~/components/AnimatedSplash';
import { AuthProvider } from '~/lib/AuthProvider';
import { PowerSyncProvider } from '~/lib/powersync/PowerSyncProvider';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const InitialLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
};

const RootLayout = () => {
  const [appIsReady, setAppIsReady] = useState(false);
  const [splashFinished, setSplashFinished] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync(Entypo.font);
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync(); // Hide splash screen as soon as app is ready
      }
    }

    prepare();
  }, []);

  const handleSplashFinish = useCallback(() => {
    setSplashFinished(true);
  }, []);

  if (!splashFinished) {
    return (
      <View style={StyleSheet.absoluteFillObject}>
        <AnimatedSplash onReady={appIsReady} onFinish={handleSplashFinish} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PowerSyncProvider>
        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <AuthProvider>
              <InitialLayout />
            </AuthProvider>
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </PowerSyncProvider>
    </GestureHandlerRootView>
  );
};

export default RootLayout;
