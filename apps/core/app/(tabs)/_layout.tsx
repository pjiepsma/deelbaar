import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useThemeColor } from 'heroui-native';

import { useLocale } from '../../src/context/LocaleContext';
import { fireHaptic } from '../../src/lib/utils/fire-haptic';

const TAB_LABEL_FONT_SIZE = 12;
const TAB_ICON_SIZE = 24;

export const unstable_settings = {
  initialRouteName: 'map',
};

export default function TabLayout() {
  const { t } = useLocale();
  const [tabBarActiveTintColor, tabBarInactiveTintColor] = useThemeColor(['accent', 'muted']);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: { fontSize: TAB_LABEL_FONT_SIZE },
        tabBarActiveTintColor,
        tabBarInactiveTintColor,
      }}
      screenListeners={{
        tabPress: () => {
          fireHaptic();
        },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: t('tabs.map'),
          tabBarIcon: ({ color }) => <Ionicons name="search-outline" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t('tabs.favorites'),
          tabBarIcon: ({ color }) => <Ionicons name="heart-outline" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="hub"
        options={{
          title: t('tabs.hub'),
          tabBarIcon: ({ color }) => <Ionicons name="albums-outline" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => <Ionicons name="person-circle-outline" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
    </Tabs>
  );
}
