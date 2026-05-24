export interface Wallet {
  id: string;
  name: string;
  address: string;
  avatarUrl: string;
  balanceUsd: number;
  change24hUsd: number;
  // Signed fractional change over the last 24h (e.g. 0.0231 -> +2.31%).
  change24h: number;
}
