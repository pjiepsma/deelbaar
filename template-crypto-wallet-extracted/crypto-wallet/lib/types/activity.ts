export type ActivityKind = "send" | "receive" | "swap" | "buy" | "sell";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  subtitle: string;
  // Signed: positive for inbound, negative for outbound.
  amountUsd: number;
  timestamp: number;
}
