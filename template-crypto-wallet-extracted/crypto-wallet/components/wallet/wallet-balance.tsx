import { View } from "react-native";

import { AppText } from "@/components/shared/app-text";
import { AppTrendChip } from "@/components/shared/app-trend-chip";
import { MOCK_WALLET } from "@/lib/mocks/wallet";
import { formatUsd } from "@/lib/utils/format";

const resolveTrend = (change: number): "up" | "neutral" | "down" => {
  if (change > 0) {
    return "up";
  }
  if (change < 0) {
    return "down";
  }
  return "neutral";
};

export const WalletBalance = (): React.ReactElement => {
  const trend = resolveTrend(MOCK_WALLET.change24h);
  const signedUsd = [
    MOCK_WALLET.change24hUsd >= 0 ? "+" : "-",
    formatUsd(Math.abs(MOCK_WALLET.change24hUsd)),
  ].join("");

  return (
    <View className="mt-6 px-5">
      <AppText className="text-3xl font-bold text-foreground">
        {formatUsd(MOCK_WALLET.balanceUsd)}
      </AppText>
      <AppTrendChip trend={trend} size="sm" variant="tertiary" className="px-0.5">
        <AppTrendChip.Value>{signedUsd}</AppTrendChip.Value>
        <AppTrendChip.Suffix>today</AppTrendChip.Suffix>
      </AppTrendChip>
    </View>
  );
};
