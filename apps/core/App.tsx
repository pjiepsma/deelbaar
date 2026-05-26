import './global.css';

import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import type { RootStackParamList } from './src/features/auth/auth.types';
import { LegalDocumentScreen } from './src/features/legal/LegalDocumentScreen';
import { ListingDetailScreen } from './src/features/listings/ListingDetailScreen';
import { useThemePreference } from './src/context/ThemePreferenceContext';
import { AuthModalStack } from './src/navigation/AuthStack';
import { rootLinking } from './src/navigation/linking';
import { navigationContainerRef } from './src/navigation/navigationContainerRef';
import { RootTabs } from './src/navigation/RootTabs';
import { AppProviders } from './src/providers/AppProviders';
import { FontGate } from './src/providers/FontGate';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigation() {
  const { resolvedScheme } = useThemePreference();
  const navigationTheme = resolvedScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <>
      <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer ref={navigationContainerRef} linking={rootLinking} theme={navigationTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={RootTabs} />
          <Stack.Screen
            name="Auth"
            component={AuthModalStack}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="ListingDetail"
            component={ListingDetailScreen}
            options={{ headerShown: false, gestureEnabled: true }}
          />
          <Stack.Screen name="LegalDocument" component={LegalDocumentScreen} options={{ headerShown: true }} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <AppProviders>
      <FontGate>
        <AppNavigation />
      </FontGate>
    </AppProviders>
  );
}
