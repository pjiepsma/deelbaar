import { PressableFeedback, useThemeColor } from "heroui-native";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { SingleColorIcon } from "@/components/icons/single-color";
import { AppText } from "@/components/shared/app-text";

export interface BuySellAmountProps {
  // Pre-formatted primary value (e.g. "$100" or "0.042 ETH").
  primary: string;
  // Pre-formatted converted value shown beneath the primary line.
  secondary: string;
  // Flip the active input unit between fiat and the selected token.
  onSwapUnits: () => void;
}

const AMOUNT_BASE_FONT_SIZE = 56;
const AMOUNT_LINE_HEIGHT = 72;
// Tuned so a fully filled input (around 13 chars including a "$"/" TICKER"
// affix) still fits on one line — see MAX_INPUT_LENGTH in `app/buy-sell.tsx`.
const AMOUNT_SCALE_PER_CHAR = 0.035;
const AMOUNT_MIN_SCALE = 0.45;

const styles = StyleSheet.create({
  amountText: {
    fontWeight: "700",
    fontFamily: "Nunito_700Bold",
    lineHeight: AMOUNT_LINE_HEIGHT,
    textAlign: "center",
  },
});

const computeAmountFontSize = (value: string): number => {
  const scale = Math.max(AMOUNT_MIN_SCALE, 1 - value.length * AMOUNT_SCALE_PER_CHAR);
  return AMOUNT_BASE_FONT_SIZE * scale;
};

export const BuySellAmount = ({
  primary,
  secondary,
  onSwapUnits,
}: BuySellAmountProps): React.ReactElement => {
  const foregroundColor = useThemeColor("foreground");
  const fontSize = useMemo(() => computeAmountFontSize(primary), [primary]);

  return (
    <View className="items-center">
      <View className="w-full justify-center px-4" style={{ height: AMOUNT_LINE_HEIGHT }}>
        <AppText
          numberOfLines={1}
          style={[styles.amountText, { fontSize, color: foregroundColor }]}
        >
          {primary}
        </AppText>
      </View>

      <PressableFeedback
        accessibilityRole="button"
        accessibilityLabel="Switch input unit"
        onPress={onSwapUnits}
        className="mt-2 flex-row items-center gap-2 rounded-full px-3 py-1"
      >
        <AppText className="text-base text-muted">{secondary}</AppText>
        <SingleColorIcon name="arrows-up-down" size={16} colorClassName="accent-muted" />
      </PressableFeedback>
    </View>
  );
};
