import type { TokenSortOptionId } from "@/lib/config/token-sort";
import type { Asset } from "@/lib/types/asset";

type Comparator = (left: Asset, right: Asset) => number;

const change24h = (asset: Asset): number => asset.changeByTimeframe["1D"];

const COMPARATORS: Readonly<Record<TokenSortOptionId, Comparator>> = {
  marketCap: (left, right) => right.marketCap - left.marketCap,
  priceIncrease24h: (left, right) => change24h(right) - change24h(left),
  priceDecrease24h: (left, right) => change24h(left) - change24h(right),
};

export const sortAssets = (
  assets: readonly Asset[],
  sortId: TokenSortOptionId,
): readonly Asset[] => {
  return [...assets].sort(COMPARATORS[sortId]);
};
