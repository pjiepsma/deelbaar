import 'react-native-reanimated';
import '../global.css';
import { useLayoutEffect, type ReactNode } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HeroUINativeProvider } from 'heroui-native/provider';
import { Uniwind } from 'uniwind';

/** Default Expo + HeroUI Native + Uniwind — nothing else. */
function Shell({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();

  useLayoutEffect(() => {
    Uniwind.setTheme('system');
  }, []);

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      {children}
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <Shell>
          <SafeAreaProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </SafeAreaProvider>
        </Shell>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
