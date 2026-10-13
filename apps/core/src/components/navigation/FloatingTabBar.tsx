import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { cn, PressableFeedback, Surface, useThemeColor } from 'heroui-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLocale } from '../../context/LocaleContext';
import { fireHaptic } from '../../lib/utils/fire-haptic';
import { TAB_BAR_SAFE_OFFSET_ADDON_PX } from '../../navigation/tabBarClearance';
import { TABS } from '../../navigation/tabs';
import { TestId } from '../../testing/testIds';

const TAB_ICON_SIZE = 22;

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const [accentForeground, muted] = useThemeColor(['accent-foreground', 'muted']);

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
      <View
        pointerEvents="box-none"
        style={{
          alignItems: 'center',
          marginBottom: insets.bottom + TAB_BAR_SAFE_OFFSET_ADDON_PX,
        }}
      >
        <Surface variant="default" className="flex-row items-center gap-1 rounded-full p-1.5 shadow-overlay">
          {state.routes.map((route, index) => {
            const config = TABS.find((tab) => tab.name === route.name);
            if (config === undefined) {
              return null;
            }
            const isFocused = state.index === index;
            const label = t(config.labelKey);

            const handlePress = (): void => {
              fireHaptic();
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const handleLongPress = (): void => {
              navigation.emit({ type: 'tabLongPress', target: route.key });
            };

            return (
              <PressableFeedback
                key={route.key}
                testID={TestId.tab(config.name)}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={label}
                onPress={handlePress}
                onLongPress={handleLongPress}
                hitSlop={6}
                className={cn(
                  'h-11 w-14 items-center justify-center rounded-full',
                  isFocused ? 'bg-accent shadow-sm' : 'bg-transparent',
                )}
              >
                <PressableFeedback.Highlight />
                <Ionicons
                  name={isFocused ? config.ioniconFocused : config.ionicon}
                  size={TAB_ICON_SIZE}
                  color={isFocused ? accentForeground : muted}
                />
              </PressableFeedback>
            );
          })}
        </Surface>
      </View>
    </View>
  );
}
