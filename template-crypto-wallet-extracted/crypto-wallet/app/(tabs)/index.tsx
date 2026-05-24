import { LinearGradient } from "expo-linear-gradient";
import { ScrollShadow } from "heroui-native";
import { SplitView } from "heroui-native-pro";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AssetsList } from "@/components/assets/assets-list";
import { QuickActions } from "@/components/home/quick-actions";
import { RecentActivity } from "@/components/home/recent-activity";
import { TAB_BAR_SAFE_OFFSET_ADDON_PX } from "@/components/navigation/floating-tab-bar";
import { WalletBalance } from "@/components/wallet/wallet-balance";
import { WalletHeader } from "@/components/wallet/wallet-header";
import { useHomeLayoutMetrics } from "@/lib/contexts/home-layout-metrics-context";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { withUniwind } from "uniwind";

// `BlurView` needs the Animated adapter to drive `intensity` on the UI thread,
// then `withUniwind` to keep className-based positioning.
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const StyledBlurView = withUniwind(AnimatedBlurView);

const HEADER_TO_HANDLE_GAP_PX = 16;
const QUICK_ACTIONS_TO_HANDLE_GAP_PX = 24;
const BLUR_INTENSITY_INITIAL = 30;
const BLUR_INTENSITY_READY = 0;

export default function HomeRoute(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { height: windowHeightPx } = useWindowDimensions();
  const { walletHeaderBottomPx, quickActionsBottomPx, floatingTabBarHeightPx, isReady } =
    useHomeLayoutMetrics();

  const lowPx = useMemo<number>(
    () => walletHeaderBottomPx + HEADER_TO_HANDLE_GAP_PX,
    [walletHeaderBottomPx],
  );

  const midPx = useMemo<number>(
    () => quickActionsBottomPx + QUICK_ACTIONS_TO_HANDLE_GAP_PX,
    [quickActionsBottomPx],
  );

  const reservedAtBottomPx = useMemo<number>(
    () => floatingTabBarHeightPx + 2 * insets.bottom + 2 * TAB_BAR_SAFE_OFFSET_ADDON_PX,
    [floatingTabBarHeightPx, insets.bottom],
  );

  const highPx = useMemo<number>(
    () => windowHeightPx - reservedAtBottomPx,
    [windowHeightPx, reservedAtBottomPx],
  );

  const snapPoints = useMemo<readonly number[]>(
    () => [lowPx, midPx, highPx],
    [lowPx, midPx, highPx],
  );

  const [snapIndex, setSnapIndex] = useState<number>(0);

  const blurIntensity = useSharedValue<number>(BLUR_INTENSITY_INITIAL);

  useEffect(() => {
    if (isReady) {
      const timeout = setTimeout(() => {
        setSnapIndex(1);
      }, 200);
      blurIntensity.value = withDelay(100, withTiming(BLUR_INTENSITY_READY));
      return () => clearTimeout(timeout);
    }
  }, [isReady, blurIntensity]);

  const blurAnimatedProps = useAnimatedProps(() => ({
    intensity: blurIntensity.value,
  }));

  return (
    <View className="flex-1 bg-background-secondary">
      <SplitView
        snapPoints={snapPoints}
        snapIndex={snapIndex}
        onSnapIndexChange={setSnapIndex}
        minHeight={lowPx}
        maxHeight={highPx}
      >
        <SplitView.TopSection className="rounded-b-3xl bg-background">
          <ScrollShadow
            LinearGradientComponent={LinearGradient}
            size={insets.top + 250}
            visibility="top"
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerClassName="pb-4 pt-safe-offset-4"
            >
              <WalletHeader />
              <WalletBalance />
              <QuickActions />
              <RecentActivity />
            </ScrollView>
          </ScrollShadow>
        </SplitView.TopSection>
        <SplitView.DragArea>
          <SplitView.DragHandle />
        </SplitView.DragArea>
        <SplitView.BottomSection className="rounded-t-3xl bg-background">
          <AssetsList />
        </SplitView.BottomSection>
      </SplitView>
      <StyledBlurView
        animatedProps={blurAnimatedProps}
        className="absolute inset-0"
        pointerEvents={isReady ? "none" : "auto"}
      />
    </View>
  );
}
