import { router, Stack } from 'expo-router';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native';
import { useUser } from '~/lib/providers/UserProvider';

const ProfileLayout = () => {
  const { profile } = useUser();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#000',
      }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: 'Profile',
          headerRight: () =>
            profile?.role === 'Admin' ? (
              <Pressable
                onPress={() => router.push('(tabs)/profile/admin')}
                style={{ marginRight: 15 }}>
                <Ionicons name="briefcase-outline" size={24} color="#000" />
              </Pressable>
            ) : null,
        }}
      />
      <Stack.Screen
        name="picker"
        options={{
          title: 'Choose a location on the map',
          headerRight: () => (
            <Pressable onPress={() => router.back()} style={{ marginRight: 15 }}>
              <Text>OK</Text>
            </Pressable>
          ),
        }}
      />
    </Stack>
  );
};

export default ProfileLayout;
