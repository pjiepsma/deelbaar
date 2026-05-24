import React from "react";

import type { AssetTicker } from "@/lib/types/asset";
import {
  DEFAULT_MULTI_COLOR_ICON_SIZE,
  type MultiColorIconBaseProps,
  type MultiColorIconSvgProps,
} from "@/lib/types/icons";

import { AdaSvg } from "./ada";
import { BinanceSvg } from "./binance";
import { BtcSvg } from "./btc";
import { CoinbaseSvg } from "./coinbase";
import { DogeSvg } from "./doge";
import { EthSvg } from "./eth";
import { LinkSvg } from "./link";
import { SolSvg } from "./sol";
import { UsdcSvg } from "./usdc";

// Constraining `satisfies` to `"coinbase" | "binance" | AssetTicker` makes the
// registry exhaustive: adding a new ticker in `lib/types/asset.ts` forces a TS
// error here until a matching primitive is registered.
const MULTI_COLOR_ICONS = {
  coinbase: CoinbaseSvg,
  binance: BinanceSvg,
  BTC: BtcSvg,
  ETH: EthSvg,
  SOL: SolSvg,
  USDC: UsdcSvg,
  ADA: AdaSvg,
  DOGE: DogeSvg,
  LINK: LinkSvg,
} as const satisfies Record<"coinbase" | "binance" | AssetTicker, React.FC<MultiColorIconSvgProps>>;

export type MultiColorIconName = keyof typeof MULTI_COLOR_ICONS;

interface MultiColorIconProps extends MultiColorIconBaseProps {
  name: MultiColorIconName;
}

/**
 * Fixed-palette icon dispatcher (exchange brand marks + crypto token glyphs).
 *
 * ```tsx
 * <MultiColorIcon name="coinbase" size={24} />
 * const ticker: AssetTicker = "BTC";
 * <MultiColorIcon name={ticker} size={40} />
 * ```
 */
export const MultiColorIcon: React.FC<MultiColorIconProps> = ({
  name,
  size = DEFAULT_MULTI_COLOR_ICON_SIZE,
}) => {
  const SvgComponent = MULTI_COLOR_ICONS[name];
  return <SvgComponent size={size} />;
};
