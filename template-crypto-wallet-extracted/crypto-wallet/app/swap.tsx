import { useRouter } from "expo-router";
import { CloseButton, Text } from "heroui-native";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ButtonGrid } from "@/components/shared/button-grid/button-grid";
import { TokenPickerSheet } from "@/components/shared/token-picker-sheet";
import { SlideToSwapButton } from "@/components/swap/slide-to-swap-button";
import { SwapDirectionButton } from "@/components/swap/swap-direction-button";
import { SwapTokenCard } from "@/components/swap/swap-token-card";
import { MOCK_ASSETS } from "@/lib/mocks/assets";
import { MOCK_BALANCES } from "@/lib/mocks/balances";
import type { Asset, AssetTicker } from "@/lib/types/asset";
import { formatTokenAmount } from "@/lib/utils/format";

type PickerTarget = "from" | "to" | null;

const MAX_INPUT_LENGTH = 11;
const INITIAL_AMOUNT = "0";

const findAsset = (ticker: AssetTicker): Asset => {
  const asset = MOCK_ASSETS.find((entry) => entry.ticker === ticker);
  if (asset === undefined) {
    // MOCK_ASSETS covers every AssetTicker, but the narrowing helper keeps
    // the rest of the screen free of `as` casts.
    throw new Error(["Missing mock asset for ticker ", ticker].join(""));
  }
  return asset;
};

export default function SwapRoute(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fromTicker, setFromTicker] = useState<AssetTicker>("USDC");
  const [toTicker, setToTicker] = useState<AssetTicker>("BTC");
  const [fromAmount, setFromAmount] = useState<string>(INITIAL_AMOUNT);
  const [picker, setPicker] = useState<PickerTarget>(null);

  const fromAsset = useMemo(() => findAsset(fromTicker), [fromTicker]);
  const toAsset = useMemo(() => findAsset(toTicker), [toTicker]);

  const fromAmountNumber = Number(fromAmount);
  const usd = Number.isFinite(fromAmountNumber) ? fromAmountNumber * fromAsset.price : 0;
  // TODO: apply slippage / quote when wiring up a real swap provider.
  const toUsd = usd;
  const toAmount = toAsset.price > 0 ? usd / toAsset.price : 0;
  const toAmountString = formatTokenAmount(toAmount);

  const isSubmitEnabled = fromAmountNumber > 0;

  const handleClose = (): void => {
    router.back();
  };

  const handleDigit = (digit: string): void => {
    if (fromAmount === INITIAL_AMOUNT) {
      setFromAmount(digit);
      return;
    }
    if (fromAmount.length >= MAX_INPUT_LENGTH) {
      return;
    }
    setFromAmount([fromAmount, digit].join(""));
  };

  const handleDot = (): void => {
    if (fromAmount.includes(".")) {
      return;
    }
    if (fromAmount.length >= MAX_INPUT_LENGTH) {
      return;
    }
    setFromAmount([fromAmount, "."].join(""));
  };

  const handleBackspace = (): void => {
    if (fromAmount.length <= 1) {
      setFromAmount(INITIAL_AMOUNT);
      return;
    }
    setFromAmount(fromAmount.slice(0, -1));
  };

  const handleClear = (): void => {
    setFromAmount(INITIAL_AMOUNT);
  };

  const handleSwapDirection = (): void => {
    setFromTicker(toTicker);
    setToTicker(fromTicker);
    setFromAmount(INITIAL_AMOUNT);
  };

  const handleOpenFromPicker = (): void => {
    setPicker("from");
  };

  const handleOpenToPicker = (): void => {
    setPicker("to");
  };

  const handlePickerOpenChange = (value: boolean): void => {
    if (!value) {
      setPicker(null);
    }
  };

  const handleSelectToken = (ticker: AssetTicker): void => {
    if (picker === "from") {
      setFromTicker(ticker);
    } else if (picker === "to") {
      setToTicker(ticker);
    }
    setFromAmount(INITIAL_AMOUNT);
    setPicker(null);
  };

  const handleSubmit = (): void => {
    // TODO: submit swap once the quote / signing pipeline exists.
  };

  return (
    <View
      className="flex-1 bg-background px-5"
      style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom }}
    >
      <View className="flex-row items-center justify-between">
        <Text.Heading type="h3">Swap</Text.Heading>
        <CloseButton onPress={handleClose} />
      </View>

      <View className="mt-6">
        <SwapTokenCard
          ticker={fromTicker}
          amount={fromAmount}
          usd={usd}
          balance={MOCK_BALANCES[fromTicker]}
          variant="input"
          onPressTokenChip={handleOpenFromPicker}
        />

        <View className="items-center -my-3 z-10">
          <SwapDirectionButton onPress={handleSwapDirection} />
        </View>

        <SwapTokenCard
          ticker={toTicker}
          amount={toAmountString}
          usd={toUsd}
          balance={MOCK_BALANCES[toTicker]}
          variant="output"
          onPressTokenChip={handleOpenToPicker}
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
        <SlideToSwapButton onPress={handleSubmit} isEnabled={isSubmitEnabled} />
      </View>

      <TokenPickerSheet
        isOpen={picker !== null}
        onOpenChange={handlePickerOpenChange}
        selectedTicker={picker === "from" ? fromTicker : toTicker}
        excludeTicker={picker === "from" ? toTicker : fromTicker}
        onSelect={handleSelectToken}
      />
    </View>
  );
}
