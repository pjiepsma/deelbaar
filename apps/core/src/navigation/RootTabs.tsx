import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

import { MapScreen } from '../features/map/MapScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { SavedScreen } from '../features/saved/SavedScreen';

const Tab = createBottomTabNavigator();
const TAB_LABEL_FONT_SIZE = 12;

export function RootTabs() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarLabelStyle: { fontSize: TAB_LABEL_FONT_SIZE },
        }}
      >
        <Tab.Screen name="Map" component={MapScreen} />
        <Tab.Screen name="Saved" component={SavedScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
