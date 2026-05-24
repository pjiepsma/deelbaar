import type { SingleColorIconName } from "@/components/icons/single-color";

export type TokenSortOptionId = "marketCap" | "priceIncrease24h" | "priceDecrease24h";

export interface TokenSortOption {
  id: TokenSortOptionId;
  label: string;
  iconName: SingleColorIconName;
}

export const TOKEN_SORT_OPTIONS: readonly TokenSortOption[] = [
  {
    id: "marketCap",
    label: "Market cap",
    iconName: "chart-column",
  },
  {
    id: "priceIncrease24h",
    label: "Price increase (24H)",
    iconName: "trend-up",
  },
  {
    id: "priceDecrease24h",
    label: "Price decrease (24H)",
    iconName: "trend-down",
  },
];

export const DEFAULT_TOKEN_SORT_ID: TokenSortOptionId = "marketCap";
