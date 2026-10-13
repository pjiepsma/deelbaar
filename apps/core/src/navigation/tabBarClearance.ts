import { Platform } from 'react-native';

/** Gap between floating pill and safe-area bottom (matches Stride). */
export const TAB_BAR_SAFE_OFFSET_ADDON_PX = 12;

/**
 * Surface `p-1.5` (6+6) + tab hit target `h-11` (44).
 * Keep in sync with FloatingTabBar className geometry.
 */
export const FLOATING_TAB_BAR_PILL_HEIGHT_PX = 56;

export function floatingTabBarOccupiedHeight(bottomInset: number): number {
  return bottomInset + TAB_BAR_SAFE_OFFSET_ADDON_PX + FLOATING_TAB_BAR_PILL_HEIGHT_PX;
}

/**
 * Extra bottom inset for absolute chrome when Android uses a floating tab bar.
 * iOS NativeTabs already insets the scene — return 0.
 */
export function tabBarOverlayClearance(bottomInset: number): number {
  if (Platform.OS !== 'android') {
    return 0;
  }
  return floatingTabBarOccupiedHeight(bottomInset);
}

/**
 * Bottom padding for tab screens that previously relied on the JS tab navigator inset.
 */
export function tabScreenBottomPadding(withTabBarSpacing: boolean, bottomInset: number): number {
  if (!withTabBarSpacing) {
    return bottomInset;
  }
  if (Platform.OS === 'android') {
    return floatingTabBarOccupiedHeight(bottomInset);
  }
  return 0;
}
