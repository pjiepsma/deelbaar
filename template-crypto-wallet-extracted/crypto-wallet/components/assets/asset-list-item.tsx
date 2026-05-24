import { useRouter } from "expo-router";
import { cn, ListGroup, PressableFeedback } from "heroui-native";
import { NumberValue } from "heroui-native-pro";
import { View } from "react-native";

import { MultiColorIcon } from "@/components/icons/multi-color";
import { AppTrendChip } from "@/components/shared/app-trend-chip";
import { TrendSparkline } from "@/components/shared/trend-sparkline";
import type { Asset } from "@/lib/types/asset";
import { fireHaptic } from "@/lib/utils/fire-haptic";
import { formatPercent } from "@/lib/utils/format";

export interface AssetListItemProps {
  asset: Asset;
  showSparkline?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  className?: string;
}

const USD_FORMAT_OPTIONS: Intl.NumberFormatOptions = {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

const resolveTrend = (change: number): "up" | "neutral" | "down" => {
  if (change > 0) {
    return "up";
  }
  if (change < 0) {
    return "down";
  }
  return "neutral";
};

export const AssetListItem = ({
  asset,
  showSparkline = true,
  onPress,
  accessibilityLabel,
  className,
}: AssetListItemProps): React.ReactElement => {
  const router = useRouter();

  const change24h = asset.changeByTimeframe["1D"];
  const trend = resolveTrend(change24h);

  const handlePress = (): void => {
    fireHaptic();
    if (onPress !== undefined) {
      onPress();
      return;
    }
    router.push({ pathname: "/asset/[id]", params: { id: asset.id } });
  };

  return (
    <PressableFeedback
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `Open ${asset.name} details`}
      onPress={handlePress}
      asChild
    >
      <ListGroup.Item className={cn("px-0 py-2.5", className)}>
        <ListGroup.ItemPrefix>
          <MultiColorIcon name={asset.ticker} size={40} />
        </ListGroup.ItemPrefix>
        <ListGroup.ItemContent className="flex-1 items-start">
          <ListGroup.ItemTitle>{asset.name}</ListGroup.ItemTitle>
          <ListGroup.ItemDescription>{asset.ticker}</ListGroup.ItemDescription>
        </ListGroup.ItemContent>
        {showSparkline ? (
          <View className="flex-1 items-end">
            <TrendSparkline series={asset.seriesByTimeframe["1D"]} trend={trend} />
          </View>
        ) : null}
        <ListGroup.ItemSuffix className="flex-1 items-end gap-0.5">
          <NumberValue value={asset.price} locale="en-US" formatOptions={USD_FORMAT_OPTIONS} />
          <AppTrendChip trend={trend} variant="tertiary" className="self-end px-0">
            {formatPercent(change24h)}
          </AppTrendChip>
        </ListGroup.ItemSuffix>
      </ListGroup.Item>
    </PressableFeedback>
  );
};
