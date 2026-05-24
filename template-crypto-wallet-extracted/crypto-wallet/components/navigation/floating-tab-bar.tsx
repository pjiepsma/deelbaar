import { type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { cn, PressableFeedback, Surface } from "heroui-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SingleColorIcon } from "@/components/icons/single-color";
import { TABS } from "@/lib/config/tabs";
import { useHomeLayoutMetrics } from "@/lib/contexts/home-layout-metrics-context";
import { fireHaptic } from "@/lib/utils/fire-haptic";

export const TAB_BAR_SAFE_OFFSET_ADDON_PX = 12;

export const FloatingTabBar = ({ state, navigation }: BottomTabBarProps): React.ReactElement => {
  const insets = useSafeAreaInsets();
  const { onFloatingTabBarLayout } = useHomeLayoutMetrics();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: insets.bottom + TAB_BAR_SAFE_OFFSET_ADDON_PX,
        alignItems: "center",
      }}
    >
      <Surface
        onLayout={onFloatingTabBarLayout}
        variant="default"
        className="flex-row items-center gap-1 rounded-full p-1.5 shadow-overlay"
      >
        {state.routes.map((route, index) => {
          const config = TABS.find((tab) => tab.name === route.name);
          if (config === undefined) {
            return null;
          }
          const isFocused = state.index === index;

          const handlePress = (): void => {
            fireHaptic();
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const handleLongPress = (): void => {
            navigation.emit({ type: "tabLongPress", target: route.key });
          };

          return (
            <PressableFeedback
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={config.label}
              onPress={handlePress}
              onLongPress={handleLongPress}
              hitSlop={6}
              className={cn(
                "h-11 w-14 items-center justify-center rounded-full",
                isFocused ? "bg-accent shadow-sm" : "bg-transparent",
              )}
            >
              <PressableFeedback.Highlight />
              <SingleColorIcon
                name={isFocused ? config.iconFocusedName : config.iconName}
                size={22}
                colorClassName={isFocused ? "accent-accent-foreground" : "accent-muted"}
              />
            </PressableFeedback>
          );
        })}
      </Surface>
    </View>
  );
};
