import { useRouter } from "expo-router";
import { Button, CloseButton } from "heroui-native";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BuySellAmount } from "@/components/buy-sell/buy-sell-amount";
import { BuySellSegment, type BuySellMode } from "@/components/buy-sell/buy-sell-segment";
import { BuySellTokenTrigger } from "@/components/buy-sell/buy-sell-token-trigger";
import { ButtonGrid } from "@/components/shared/button-grid/button-grid";
import { TokenPickerSheet } from "@/components/shared/token-picker-sheet";
import { MOCK_ASSETS } from "@/lib/mocks/assets";
import { MOCK_BALANCES } from "@/lib/mocks/balances";
import type { Asset, AssetTicker } from "@/lib/types/asset";
import { formatTokenAmount, formatUsd } from "@/lib/utils/format";

type AmountUnit = "usd" | "token";

const MAX_INPUT_LENGTH = 11;
const INITIAL_AMOUNT = "0";

const findAsset = (ticker: AssetTicker): Asset => {
  const asset = MOCK_ASSETS.find((entry) => entry.ticker === ticker);
  if (asset === undefined) {
    throw new Error(["Missing mock asset for ticker ", ticker].join(""));
  }
  return asset;
};

const formatPrimary = (amount: string, unit: AmountUnit, ticker: AssetTicker): string => {
  if (unit === "usd") {
    return ["$", amount].join("");
  }
  return [amount, " ", ticker].join("");
};

const formatSecondary = (
  amount: string,
  unit: AmountUnit,
  ticker: AssetTicker,
  price: number,
): string => {
  const value = Number(amount);
  if (!Number.isFinite(value)) {
    return unit === "usd" ? ["0 ", ticker].join("") : formatUsd(0);
  }
  if (unit === "usd") {
    const tokenValue = price > 0 ? value / price : 0;
    return [formatTokenAmount(tokenValue), " ", ticker].join("");
  }
  return formatUsd(value * price);
};

export default function BuySellRoute(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<BuySellMode>("buy");
  const [ticker, setTicker] = useState<AssetTicker>("ETH");
  const [unit, setUnit] = useState<AmountUnit>("usd");
  const [amount, setAmount] = useState<string>(INITIAL_AMOUNT);

  const asset = useMemo(() => findAsset(ticker), [ticker]);

  const primary = formatPrimary(amount, unit, ticker);
  const secondary = formatSecondary(amount, unit, ticker, asset.price);

  const isSubmitEnabled = Number(amount) > 0;

  const handleClose = (): void => {
    router.back();
  };

  const handleDigit = (digit: string): void => {
    if (amount === INITIAL_AMOUNT) {
      setAmount(digit);
      return;
    }
    if (amount.length >= MAX_INPUT_LENGTH) {
      return;
    }
    setAmount([amount, digit].join(""));
  };

  const handleDot = (): void => {
    if (amount.includes(".")) {
      return;
    }
    if (amount.length >= MAX_INPUT_LENGTH) {
      return;
    }
    setAmount([amount, "."].join(""));
  };

  const handleBackspace = (): void => {
    if (amount.length <= 1) {
      setAmount(INITIAL_AMOUNT);
      return;
    }
    setAmount(amount.slice(0, -1));
  };

  const handleClear = (): void => {
    setAmount(INITIAL_AMOUNT);
  };

  // Reset the input on unit flip so we never carry, say, a $100 value into a
  // token-denominated input (and vice versa).
  const handleSwapUnits = (): void => {
    setUnit((current) => (current === "usd" ? "token" : "usd"));
    setAmount(INITIAL_AMOUNT);
  };

  const handleSelectToken = (next: AssetTicker): void => {
    setTicker(next);
    setAmount(INITIAL_AMOUNT);
  };

  const handleSubmit = (): void => {
    // TODO: wire fiat onramp / sell flow.
  };

  return (
    <View
      className="flex-1 bg-background px-5"
      style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom }}
    >
      <View className="flex-row items-center justify-between">
        <View className="w-10" />
        <BuySellSegment value={mode} onValueChange={setMode} />
        <View className="w-10 items-end">
          <CloseButton onPress={handleClose} />
        </View>
      </View>

      <View className="mt-10">
        <BuySellAmount primary={primary} secondary={secondary} onSwapUnits={handleSwapUnits} />
      </View>

      <View className="mt-10">
        <TokenPickerSheet
          selectedTicker={ticker}
          onSelect={handleSelectToken}
          trigger={
            <BuySellTokenTrigger
              ticker={ticker}
              assetName={asset.name}
              balance={MOCK_BALANCES[ticker]}
            />
          }
        />
      </View>

      <View className="flex-1" />

      <ButtonGrid
        onDigit={handleDigit}
        onDot={handleDot}
        onBackspace={handleBackspace}
        onClear={handleClear}
      />

      <View className="mt-4">
        <Button size="lg" onPress={handleSubmit} isDisabled={!isSubmitEnabled}>
          <Button.Label>Continue</Button.Label>
        </Button>
      </View>
    </View>
  );
}
