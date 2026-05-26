import '../global.css';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { SignupCredentialsProvider } from '../src/context/SignupCredentialsContext';
import { useThemePreference } from '../src/context/ThemePreferenceContext';
import { FULL_BLEED_SCREEN_OPTIONS } from '../src/navigation/screenOptions';
import { AppProviders } from '../src/providers/AppProviders';
import { FontGate } from '../src/providers/FontGate';

function RootStack() {
  const { resolvedScheme } = useThemePreference();
  const navigationTheme = resolvedScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ gestureEnabled: true }}>
        <Stack.Screen name="(tabs)" options={FULL_BLEED_SCREEN_OPTIONS} />
        <Stack.Screen name="auth" options={FULL_BLEED_SCREEN_OPTIONS} />
        <Stack.Screen name="listing" options={FULL_BLEED_SCREEN_OPTIONS} />
        <Stack.Screen name="legal/[page]" options={FULL_BLEED_SCREEN_OPTIONS} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <FontGate>
        <SignupCredentialsProvider>
          <RootStack />
        </SignupCredentialsProvider>
      </FontGate>
    </AppProviders>
  );
}
