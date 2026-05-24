import { type ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface ScreenProps extends ViewProps {
  withTabBarSpacing?: boolean;
  children: ReactNode;
}

const TAB_BAR_CLEARANCE_PX = 72;

export const Screen = ({
  withTabBarSpacing = false,
  children,
  style,
  ...rest
}: ScreenProps): React.ReactElement => {
  const insets = useSafeAreaInsets();
  return (
    <View
      {...rest}
      className="flex-1 bg-background"
      style={[
        {
          paddingTop: insets.top,
          paddingBottom: withTabBarSpacing ? TAB_BAR_CLEARANCE_PX : insets.bottom,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
