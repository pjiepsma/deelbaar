import "../global.css";

import {
  Nunito_300Light,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { HeroUINativeProvider } from "heroui-native";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { HomeLayoutMetricsProvider } from "@/lib/contexts/home-layout-metrics-context";

// Defensive .catch: under Fast Refresh / Expo Go, the native splash module
// can already be in a finalized state when this module re-evaluates. We
// swallow the rejection so it doesn't surface as an unhandled-promise error.
SplashScreen.preventAutoHideAsync().catch((): void => { });

export default function RootLayout(): React.ReactElement | null {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_300Light,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect((): void => {
    if (fontsLoaded || fontError !== null) {
      SplashScreen.hideAsync().catch((): void => { });
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && fontError === null) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <HeroUINativeProvider>
          <HomeLayoutMetricsProvider>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "red" } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="asset/[id]"
                options={{
                  presentation: "modal",
                }}
              />
              <Stack.Screen
                name="send"
                options={{
                  presentation: "pageSheet",
                }}
              />
              <Stack.Screen
                name="receive"
                options={{
                  presentation: "pageSheet",
                }}
              />
              <Stack.Screen name="swap" />
              <Stack.Screen name="buy-sell" />
            </Stack>
          </HomeLayoutMetricsProvider>
        </HeroUINativeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
