import { router, Stack } from 'expo-router';
import { Pressable, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '~/lib/providers/AuthProvider';
import { Text } from 'react-native';

const FavoritesLayout = () => {
  const { user } = useAuth();
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Favorites',
        }}
      />
    </Stack>
  );
};

export default FavoritesLayout;
