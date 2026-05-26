import {
  Nunito_300Light,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Spinner } from 'heroui-native';
import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { View } from 'react-native';

SplashScreen.preventAutoHideAsync().catch((): void => {});

export function FontGate({ children }: PropsWithChildren) {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_300Light,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError !== null) {
      SplashScreen.hideAsync().catch((): void => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && fontError === null) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner size="lg" />
      </View>
    );
  }

  if (fontError !== null) {
    throw fontError;
  }

  return children;
}
