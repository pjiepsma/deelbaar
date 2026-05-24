import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { CloseButton, colorKit, ScrollShadow, useThemeColor } from "heroui-native";
import { useState } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

import { AssetChart } from "@/components/asset-detail/asset-chart";
import { AssetDetailFooter } from "@/components/asset-detail/asset-detail-footer";
import { AssetInfo } from "@/components/asset-detail/asset-info";
import { AssetStats } from "@/components/asset-detail/asset-stats";
import { MultiColorIcon } from "@/components/icons/multi-color";
import { AppText } from "@/components/shared/app-text";
import { AppTrendChip } from "@/components/shared/app-trend-chip";
import { TIMEFRAME_LABELS, findAssetById } from "@/lib/mocks/assets";
import type { AssetTimeframe } from "@/lib/types/asset";
import { formatPercent, formatUsd } from "@/lib/utils/format";

const StyledLinearGradient = withUniwind(LinearGradient);

const resolveTrend = (change: number): "up" | "neutral" | "down" => {
  if (change > 0) {
    return "up";
  }
  if (change < 0) {
    return "down";
  }
  return "neutral";
};

export default function AssetDetailRoute(): React.ReactElement {
  const [footerHeight, setFooterHeight] = useState(0);
  const [timeframe, setTimeframe] = useState<AssetTimeframe>("1D");

  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const asset = findAssetById(params.id);

  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const scrollHeight = screenHeight - (insets.top + 12) - footerHeight - 50;

  const backgroundColor = useThemeColor("background");

  if (asset === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-5">
        <AppText className="text-base text-foreground">Asset not found.</AppText>
      </View>
    );
  }

  const handleClose = (): void => {
    router.back();
  };

  return (
    <View className="bg-background flex-1">
      <View className="flex-row items-center gap-3 px-5 pt-5">
        <MultiColorIcon name={asset.ticker} size={44} />
        <View className="flex-1">
          <AppText className="text-lg font-semibold text-foreground">{asset.name}</AppText>
          <AppText className="text-sm text-muted">{asset.ticker}</AppText>
        </View>
        <CloseButton onPress={handleClose} />
      </View>
      <View style={{ height: scrollHeight }}>
        <ScrollShadow LinearGradientComponent={LinearGradient} visibility="bottom">
          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-6 py-8">
            <View className="px-5">
              <AppText className="text-3xl font-bold text-foreground">
                {formatUsd(asset.price)}
              </AppText>
              <View className="flex-row items-center gap-2">
                <AppTrendChip
                  trend={resolveTrend(asset.changeByTimeframe[timeframe])}
                  size="md"
                  variant="tertiary"
                  className="px-0"
                >
                  {formatPercent(asset.changeByTimeframe[timeframe])}
                </AppTrendChip>
                <AppText className="text-sm text-muted">{TIMEFRAME_LABELS[timeframe]}</AppText>
              </View>
            </View>

            <AssetChart asset={asset} timeframe={timeframe} onTimeframeChange={setTimeframe} />
            <AssetInfo asset={asset} />
            <AssetStats asset={asset} />
          </ScrollView>
        </ScrollShadow>
        <StyledLinearGradient
          colors={[
            colorKit.setAlpha(backgroundColor, 1).hex(),
            colorKit.setAlpha(backgroundColor, 0).hex(),
          ]}
          className="absolute top-0 left-0 right-0 h-10"
          pointerEvents="none"
        />
      </View>
      <View onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}>
        <AssetDetailFooter asset={asset} />
      </View>
    </View>
  );
}
