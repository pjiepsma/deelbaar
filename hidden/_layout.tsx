import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useSystem } from '~/lib/powersync/PowerSync';

const Layout = () => {
  const { connector, powersync } = useSystem();

  const onSignOut = async () => {
    await powersync.disconnectAndClear();
    await connector.client.auth.signOut();
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: 'Power Todos 3',
            headerStyle: { backgroundColor: '#151515' },
            headerTitleStyle: { color: '#fff' },
            headerLeft: () => (
              <TouchableOpacity onPress={onSignOut}>
                <Ionicons name="log-out-outline" size={24} color="white" />
              </TouchableOpacity>
            ),
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
};
export default Layout;
