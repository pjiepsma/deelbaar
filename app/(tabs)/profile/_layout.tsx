import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#000',
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Account',
        }}
      />
      <Stack.Screen name="manage-listings" options={{ title: 'Beheer mijn listings' }} />
      <Stack.Screen name="personal-details" options={{ title: 'Persoonlijke gegevens' }} />
      <Stack.Screen name="login-settings" options={{ title: 'Inloginstellingen' }} />
      <Stack.Screen name="email-settings" options={{ title: 'E-mail instellingen' }} />
      <Stack.Screen name="push-settings" options={{ title: 'Pushmeldingen' }} />
      <Stack.Screen name="faq" options={{ title: 'Veelgestelde vragen' }} />
      <Stack.Screen name="terms" options={{ title: 'Voorwaarden & beleid' }} />
      <Stack.Screen name="stats" options={{ title: 'Statistieken' }} />
      <Stack.Screen name="admin" options={{ title: 'Admin tools' }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Wachtwoord vergeten' }} />
      <Stack.Screen name="reset-password" options={{ title: 'Wachtwoord resetten' }} />
    </Stack>
  );
}
