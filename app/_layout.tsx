import Entypo from '@expo/vector-icons/Entypo';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Font from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import { SplashScreen, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../reanimated.config';
import '@azure/core-asynciterator-polyfill';
import AnimatedSplash from '~/components/AnimatedSplash';
import Colors from '~/constants/Colors';
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
  const [isReady, setReady] = useState(true);
  const [isVisible, setVisible] = useState(true);

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync(Colors.light);
  }, []);

  useEffect(() => {
    SplashScreen.hideAsync();

    async function prepare() {
      try {
        await Font.loadAsync(Entypo.font);
      } catch (e) {
        console.warn(e);
      }
    }

    prepare();
  }, []);

  const handleSplash = useCallback(() => {
    setVisible(false);
    NavigationBar.setBackgroundColorAsync(Colors.white);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PowerSyncProvider>
        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <AuthProvider>
              <InitialLayout />
              {/*{isVisible && (*/}
              {/*  <View style={StyleSheet.absoluteFillObject}>*/}
              {/*    <AnimatedSplash onReady={isReady} onFinish={handleSplash} />*/}
              {/*  </View>*/}
              {/*)}*/}
            </AuthProvider>
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </PowerSyncProvider>
    </GestureHandlerRootView>
  );
};

export default RootLayout;
