import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tabScreenBottomPadding } from '../../navigation/tabBarClearance';

export interface ScreenProps extends ViewProps {
  children: ReactNode;
  withTabBarSpacing?: boolean;
  horizontalPadding?: number;
}

export function Screen({
  withTabBarSpacing = false,
  horizontalPadding = 0,
  children,
  style,
  ...rest
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      {...rest}
      className="flex-1 bg-background"
      style={[
        {
          paddingTop: insets.top,
          paddingBottom: tabScreenBottomPadding(withTabBarSpacing, insets.bottom),
          paddingHorizontal: horizontalPadding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
