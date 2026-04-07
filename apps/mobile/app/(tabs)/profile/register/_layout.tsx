import { Stack } from 'expo-router';
import Colors from '~/constants/Colors';

export default function RegisterLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: 'Registeren',
        headerStyle: {
          backgroundColor: Colors.white,
        },
        headerTitleStyle: {
          fontWeight: '600',
          color: Colors.primary,
        },
        headerBackTitleVisible: false,
      }}>
      <Stack.Screen name="step1-account" />
      <Stack.Screen name="step2-verify-email" />
      <Stack.Screen name="step3-address" />
      <Stack.Screen name="step4-profile" />
    </Stack>
  );
}









