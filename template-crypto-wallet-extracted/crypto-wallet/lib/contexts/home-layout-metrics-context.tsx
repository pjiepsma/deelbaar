import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { View, type LayoutChangeEvent } from "react-native";

export interface HomeLayoutMetricsContextValue {
  walletHeaderBottomPx: number;
  quickActionsBottomPx: number;
  floatingTabBarHeightPx: number;
  isReady: boolean;
  onWalletHeaderLayout: (event: LayoutChangeEvent) => void;
  onQuickActionsLayout: (event: LayoutChangeEvent) => void;
  onFloatingTabBarLayout: (event: LayoutChangeEvent) => void;
}

// Defaults used until the first layout pass arrives; replaced as soon as
// real values flow in.
const DEFAULT_WALLET_HEADER_BOTTOM_PX = 80;
const DEFAULT_QUICK_ACTIONS_BOTTOM_PX = 320;
const DEFAULT_FLOATING_TAB_BAR_HEIGHT_PX = 56;

const HomeLayoutMetricsContext = createContext<HomeLayoutMetricsContextValue | null>(null);

const useBottomYHandler = (
  setter: (next: number) => void,
): ((event: LayoutChangeEvent) => void) => {
  return useCallback(
    (event: LayoutChangeEvent): void => {
      const { y, height } = event.nativeEvent.layout;
      const next = Math.round(y + height);
      if (next > 0) {
        setter(next);
      }
    },
    [setter],
  );
};

const useHeightHandler = (setter: (next: number) => void): ((event: LayoutChangeEvent) => void) => {
  return useCallback(
    (event: LayoutChangeEvent): void => {
      const { height } = event.nativeEvent.layout;
      const next = Math.round(height);
      if (next > 0) {
        setter(next);
      }
    },
    [setter],
  );
};

export const HomeLayoutMetricsProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const [walletHeaderBottomPx, setWalletHeaderBottomPx] = useState<number>(
    DEFAULT_WALLET_HEADER_BOTTOM_PX,
  );
  const [quickActionsBottomPx, setQuickActionsBottomPx] = useState<number>(
    DEFAULT_QUICK_ACTIONS_BOTTOM_PX,
  );
  const [floatingTabBarHeightPx, setFloatingTabBarHeightPx] = useState<number>(
    DEFAULT_FLOATING_TAB_BAR_HEIGHT_PX,
  );

  const [isWalletHeaderMeasured, setIsWalletHeaderMeasured] = useState<boolean>(false);
  const [isQuickActionsMeasured, setIsQuickActionsMeasured] = useState<boolean>(false);
  const [isFloatingTabBarMeasured, setIsFloatingTabBarMeasured] = useState<boolean>(false);

  // Skip unchanged values to avoid feedback loops between onLayout and state.
  const updateWalletHeaderBottom = useCallback((next: number): void => {
    setWalletHeaderBottomPx((prev) => (prev === next ? prev : next));
    setIsWalletHeaderMeasured(true);
  }, []);

  const updateQuickActionsBottom = useCallback((next: number): void => {
    setQuickActionsBottomPx((prev) => (prev === next ? prev : next));
    setIsQuickActionsMeasured(true);
  }, []);

  const updateFloatingTabBarHeight = useCallback((next: number): void => {
    setFloatingTabBarHeightPx((prev) => (prev === next ? prev : next));
    setIsFloatingTabBarMeasured(true);
  }, []);

  const onWalletHeaderLayout = useBottomYHandler(updateWalletHeaderBottom);
  const onQuickActionsLayout = useBottomYHandler(updateQuickActionsBottom);
  const onFloatingTabBarLayout = useHeightHandler(updateFloatingTabBarHeight);

  const isReady = isWalletHeaderMeasured && isQuickActionsMeasured && isFloatingTabBarMeasured;

  const value = useMemo<HomeLayoutMetricsContextValue>(
    () => ({
      walletHeaderBottomPx,
      quickActionsBottomPx,
      floatingTabBarHeightPx,
      isReady,
      onWalletHeaderLayout,
      onQuickActionsLayout,
      onFloatingTabBarLayout,
    }),
    [
      walletHeaderBottomPx,
      quickActionsBottomPx,
      floatingTabBarHeightPx,
      isReady,
      onWalletHeaderLayout,
      onQuickActionsLayout,
      onFloatingTabBarLayout,
    ],
  );

  return (
    <HomeLayoutMetricsContext.Provider value={value}>
      <View className="flex-1 bg-background">{children}</View>
    </HomeLayoutMetricsContext.Provider>
  );
};

export const useHomeLayoutMetrics = (): HomeLayoutMetricsContextValue => {
  const value = useContext(HomeLayoutMetricsContext);
  if (value === null) {
    throw new Error("useHomeLayoutMetrics must be used inside a <HomeLayoutMetricsProvider />");
  }
  return value;
};
