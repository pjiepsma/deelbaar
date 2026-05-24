import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useThemeColor } from 'heroui-native';

import { useLocale } from '../context/LocaleContext';
import { HubTabScreen } from '../features/hub/HubTabScreen';
import { MapScreen } from '../features/map/MapScreen';
import { ProfileTabScreen } from '../features/profile/ProfileTabScreen';
import { SavedScreen } from '../features/saved/SavedScreen';

const Tab = createBottomTabNavigator();
const TAB_LABEL_FONT_SIZE = 12;
const TAB_ICON_SIZE = 24;

export function RootTabs() {
  const { t } = useLocale();
  const [tabBarActiveTintColor, tabBarInactiveTintColor] = useThemeColor(['accent', 'muted']);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: { fontSize: TAB_LABEL_FONT_SIZE },
        tabBarActiveTintColor,
        tabBarInactiveTintColor,
      }}
    >
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: t('tabs.map'),
          tabBarIcon: ({ color }) => <Ionicons name="search-outline" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={SavedScreen}
        options={{
          tabBarLabel: t('tabs.favorites'),
          tabBarIcon: ({ color }) => <Ionicons name="heart-outline" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tab.Screen
        name="Hub"
        component={HubTabScreen}
        options={{
          tabBarLabel: t('tabs.hub'),
          tabBarIcon: ({ color }) => <Ionicons name="albums-outline" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileTabScreen}
        options={{
          tabBarLabel: t('tabs.profile'),
          tabBarIcon: ({ color }) => <Ionicons name="person-circle-outline" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
