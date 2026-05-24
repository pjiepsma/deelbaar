import { View } from "react-native";

import { MultiColorIcon } from "@/components/icons/multi-color";
import { SingleColorIcon } from "@/components/icons/single-color";
import { AppText } from "@/components/shared/app-text";
import type { AssetTicker } from "@/lib/types/asset";
import { formatTokenAmount } from "@/lib/utils/format";

export interface BuySellTokenTriggerProps {
  ticker: AssetTicker;
  assetName: string;
  balance: number;
}

/**
 * Visual-only trigger card for the Buy/Sell asset picker. Press handling
 * lives on the surrounding `TokenPickerSheet` wrapper, so this component
 * stays a pure presentational view.
 */
export const BuySellTokenTrigger = ({
  ticker,
  assetName,
  balance,
}: BuySellTokenTriggerProps): React.ReactElement => {
  return (
    <View className="flex-row items-center gap-3 rounded-3xl bg-surface-secondary px-4 py-3">
      <MultiColorIcon name={ticker} size={40} />

      <View className="flex-1">
        <AppText className="text-base font-semibold text-foreground">{assetName}</AppText>
        <AppText className="text-sm text-muted">
          {["Balance: ", formatTokenAmount(balance), " ", ticker].join("")}
        </AppText>
      </View>

      <SingleColorIcon name="chevron-right" size={16} colorClassName="accent-muted" />
    </View>
  );
};
