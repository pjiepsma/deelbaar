export type AssetTicker = "BTC" | "ETH" | "SOL" | "USDC" | "ADA" | "DOGE" | "LINK";

export type AssetTimeframe = "1H" | "1D" | "1W" | "1M" | "1Y" | "All";

// Type alias (not interface) so it satisfies the `Record<string, unknown>`
// constraint imposed by `victory-native`'s `CartesianChart` generic.
export type AssetSeriesPoint = {
  x: number;
  value: number;
};

export interface Asset {
  id: string;
  name: string;
  ticker: AssetTicker;
  price: number;
  changeByTimeframe: Readonly<Record<AssetTimeframe, number>>;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  ath: number;
  description: string;
  isFavorite: boolean;
  seriesByTimeframe: Readonly<Record<AssetTimeframe, readonly AssetSeriesPoint[]>>;
}
