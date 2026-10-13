import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Surface } from 'heroui-native';

import { tabScreenBottomPadding } from '../../../navigation/tabBarClearance';
import { ACCOUNT_ACTION_BAR_HEIGHT, ACCOUNT_CANVAS_PAD } from './accountTheme';

type Props = {
  children: ReactNode;
  stickyBottom?: ReactNode;
  showGlow?: boolean;
  withTabBar?: boolean;
};

/**
 * Full-bleed canvas. With tab bar, do **not** pad the outer shell — floating pill overlays;
 * scroll content must add `tabScreenBottomPadding` so last rows clear the pill.
 */
export function AccountCanvas({ children, stickyBottom, showGlow = true, withTabBar = false }: Props) {
  const insets = useSafeAreaInsets();
  const tabClearance = tabScreenBottomPadding(withTabBar, insets.bottom);
  const stickyBottomSpace = stickyBottom ? ACCOUNT_ACTION_BAR_HEIGHT + 16 : 0;
  /** Outer pad only when no floating tab overlay — otherwise scene fills under the pill. */
  const outerBottomPad = withTabBar ? stickyBottomSpace : insets.bottom + stickyBottomSpace;

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: outerBottomPad }}
    >
      {showGlow ? (
        <Surface
          className="bg-accent/12 absolute left-0 right-0 top-0"
          style={{ height: 220, borderBottomLeftRadius: 80, borderBottomRightRadius: 80 }}
          pointerEvents="none"
        />
      ) : null}
      <View className="flex-1" style={{ paddingHorizontal: ACCOUNT_CANVAS_PAD }}>
        {children}
      </View>
      {stickyBottom ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: tabClearance,
            paddingHorizontal: ACCOUNT_CANVAS_PAD,
          }}
        >
          {stickyBottom}
        </View>
      ) : null}
    </View>
  );
}
