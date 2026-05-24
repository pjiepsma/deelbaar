import { Surface, Text as HeroText } from "heroui-native";
import { View } from "react-native";

import { AppText } from "@/components/shared/app-text";
import type { Asset } from "@/lib/types/asset";
import { formatCompactNumber, formatUsd, formatUsdCompact } from "@/lib/utils/format";

export interface AssetStatsProps {
  asset: Asset;
}

const StatTile = ({ label, value }: { label: string; value: string }): React.ReactElement => {
  return (
    <Surface className="flex-1 gap-1 rounded-2xl px-4 py-3 shadow-none">
      <AppText className="text-xs text-muted">{label}</AppText>
      <AppText className="text-base font-semibold text-foreground" numberOfLines={1}>
        {value}
      </AppText>
    </Surface>
  );
};

export const AssetStats = ({ asset }: AssetStatsProps): React.ReactElement => {
  return (
    <View className="gap-3 px-5">
      <HeroText.Heading type="h6">Stats</HeroText.Heading>
      <View className="gap-3">
        <View className="flex-row gap-3">
          <StatTile label="Market cap" value={formatUsdCompact(asset.marketCap)} />
          <StatTile label="24h volume" value={formatUsdCompact(asset.volume24h)} />
        </View>
        <View className="flex-row gap-3">
          <StatTile
            label="Circulating supply"
            value={[formatCompactNumber(asset.circulatingSupply), asset.ticker].join(" ")}
          />
          <StatTile label="All-time high" value={formatUsd(asset.ath)} />
        </View>
      </View>
    </View>
  );
};
