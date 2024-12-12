import Entypo from "@expo/vector-icons/Entypo";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import * as Font from "expo-font";
import * as NavigationBar from "expo-navigation-bar";
import { Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import "../reanimated.config";
import "@azure/core-asynciterator-polyfill";
import AnimatedSplash from "~/components/AnimatedSplash";
import Colors from "~/constants/Colors";
import { AuthProvider } from "~/lib/AuthProvider";
import { PowerSyncProvider } from "~/lib/powersync/PowerSyncProvider";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const InitialLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
};

const App = () => {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync(Colors.white);
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync(Entypo.font);
      } catch (e) {
        console.warn(e);
      } finally {
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(() => {
    if (appIsReady) {
      NavigationBar.setBackgroundColorAsync(Colors.white);
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
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

export default App;
