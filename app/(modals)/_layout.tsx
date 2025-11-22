import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: 'modal',
      }}>
      <Stack.Screen
        name="listing/[id]"
        options={{
          headerShown: true,
          headerTransparent: true,
          title: '',
        }}
      />
      <Stack.Screen
        name="review"
        options={{
          headerShown: true,
          title: 'Plaats een review',
        }}
      />
    </Stack>
  );
}
