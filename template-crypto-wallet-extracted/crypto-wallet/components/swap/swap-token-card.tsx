import { PressableFeedback, useThemeColor } from "heroui-native";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { MultiColorIcon } from "@/components/icons/multi-color";
import { SingleColorIcon } from "@/components/icons/single-color";
import { AppText } from "@/components/shared/app-text";
import type { AssetTicker } from "@/lib/types/asset";
import { formatTokenAmount, formatUsd } from "@/lib/utils/format";

export interface SwapTokenCardProps {
  ticker: AssetTicker;
  amount: string;
  usd: number;
  balance: number;
  variant: "input" | "output";
  onPressTokenChip: () => void;
}

const AMOUNT_BASE_FONT_SIZE = 44;
const AMOUNT_LINE_HEIGHT = 56;
// Mild typographic shrink as the value grows so long inputs still fit on
// a single line without truncation. Tuned against `MAX_INPUT_LENGTH = 11`
// in `app/swap.tsx`: 1 char -> 1.0, 11 chars -> 0.56, 12+ chars -> floor.
const AMOUNT_SCALE_PER_CHAR = 0.04;
const AMOUNT_MIN_SCALE = 0.5;

const styles = StyleSheet.create({
  amountText: {
    fontWeight: "700",
    fontFamily: "Nunito_700Bold",
    lineHeight: AMOUNT_LINE_HEIGHT,
  },
});

const computeAmountFontSize = (value: string): number => {
  const scale = Math.max(AMOUNT_MIN_SCALE, 1 - value.length * AMOUNT_SCALE_PER_CHAR);
  return AMOUNT_BASE_FONT_SIZE * scale;
};

export const SwapTokenCard = ({
  ticker,
  amount,
  usd,
  balance,
  variant,
  onPressTokenChip,
}: SwapTokenCardProps): React.ReactElement => {
  const foregroundColor = useThemeColor("foreground");
  const mutedColor = useThemeColor("muted");

  const amountColor = variant === "input" ? foregroundColor : mutedColor;
  const fontSize = useMemo(() => computeAmountFontSize(amount), [amount]);

  return (
    <View className="rounded-3xl bg-surface-secondary px-5 py-4">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1" style={{ height: AMOUNT_LINE_HEIGHT }}>
          <AppText numberOfLines={1} style={[styles.amountText, { fontSize, color: amountColor }]}>
            {amount}
          </AppText>
        </View>

        <PressableFeedback
          accessibilityRole="button"
          accessibilityLabel={`Choose ${variant === "input" ? "from" : "to"} token`}
          onPress={onPressTokenChip}
          className="flex-row items-center gap-2 rounded-full bg-surface pl-1 pr-3 py-1"
        >
          <MultiColorIcon name={ticker} size={28} />
          <AppText className="text-base font-semibold text-foreground">{ticker}</AppText>
          <SingleColorIcon name="chevron-right" size={14} colorClassName="accent-muted" />
        </PressableFeedback>
      </View>

      <View className="mt-2 flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-1.5">
          <AppText className="text-sm text-muted">{formatUsd(usd)}</AppText>
          {variant === "input" ? (
            <SingleColorIcon name="refresh" size={14} colorClassName="accent-muted" />
          ) : null}
        </View>

        <View className="flex-row items-center gap-1.5">
          <SingleColorIcon name="wallet" size={14} colorClassName="accent-muted" />
          <AppText className="text-sm text-muted">{formatTokenAmount(balance)}</AppText>
        </View>
      </View>
    </View>
  );
};
