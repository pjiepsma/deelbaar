import { useRouter } from "expo-router";
import { PressableFeedback, Surface } from "heroui-native";
import { View } from "react-native";

import { MultiColorIcon } from "@/components/icons/multi-color";
import { AppText } from "@/components/shared/app-text";
import { AppTrendChip } from "@/components/shared/app-trend-chip";
import { type SparklineTrend, TrendSparkline } from "@/components/shared/trend-sparkline";
import type { Asset } from "@/lib/types/asset";
import { fireHaptic } from "@/lib/utils/fire-haptic";
import { formatPercent, formatUsd } from "@/lib/utils/format";

export interface FavoriteTokenCardProps {
  asset: Asset;
}

const CARD_WIDTH_PX = 176;
const SPARKLINE_WIDTH_PX = 144;
const SPARKLINE_HEIGHT_PX = 40;

const resolveTrend = (change: number): SparklineTrend => {
  if (change > 0) {
    return "up";
  }
  if (change < 0) {
    return "down";
  }
  return "neutral";
};

export const FavoriteTokenCard = ({ asset }: FavoriteTokenCardProps): React.ReactElement => {
  const router = useRouter();

  const change24h = asset.changeByTimeframe["1D"];
  const trend = resolveTrend(change24h);

  const handlePress = (): void => {
    fireHaptic();
    router.push({ pathname: "/asset/[id]", params: { id: asset.id } });
  };

  return (
    <PressableFeedback
      accessibilityRole="button"
      accessibilityLabel={`Open ${asset.name} details`}
      onPress={handlePress}
      className="rounded-3xl"
      style={{ width: CARD_WIDTH_PX }}
    >
      <Surface className="gap-3 p-4">
        <View className="flex-row items-center gap-2">
          <MultiColorIcon name={asset.ticker} size={28} />
          <View className="flex-1">
            <AppText className="text-sm font-semibold text-foreground" numberOfLines={1}>
              {asset.name}
            </AppText>
            <AppText className="text-xs text-muted" numberOfLines={1}>
              {asset.ticker}
            </AppText>
          </View>
        </View>
        <TrendSparkline
          series={asset.seriesByTimeframe["1D"]}
          trend={trend}
          width={SPARKLINE_WIDTH_PX}
          height={SPARKLINE_HEIGHT_PX}
        />
        <View className="flex-row items-center justify-between">
          <AppText className="text-xs font-semibold text-foreground" numberOfLines={1}>
            {formatUsd(asset.price)}
          </AppText>
          <AppTrendChip trend={trend} variant="tertiary" className="px-0">
            {formatPercent(change24h)}
          </AppTrendChip>
        </View>
      </Surface>
    </PressableFeedback>
  );
};
