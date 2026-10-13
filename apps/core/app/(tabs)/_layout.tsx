import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useThemeColor } from 'heroui-native';
import { Platform } from 'react-native';

import { FloatingTabBar } from '../../src/components/navigation/FloatingTabBar';
import { useLocale } from '../../src/context/LocaleContext';
import { TABS } from '../../src/navigation/tabs';

export const unstable_settings = {
  initialRouteName: 'map',
};

export default function TabLayout() {
  const { t } = useLocale();
  const [accentColor, mutedColor] = useThemeColor(['accent', 'muted']);

  if (Platform.OS === 'ios') {
    return (
      <NativeTabs tintColor={accentColor} iconColor={mutedColor}>
        {TABS.map((tab) => (
          <NativeTabs.Trigger key={tab.name} name={tab.name}>
            <NativeTabs.Trigger.Label>{t(tab.labelKey)}</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon
              src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name={tab.ionicon} />}
            />
          </NativeTabs.Trigger>
        ))}
      </NativeTabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: t(tab.labelKey) }} />
      ))}
    </Tabs>
  );
}
