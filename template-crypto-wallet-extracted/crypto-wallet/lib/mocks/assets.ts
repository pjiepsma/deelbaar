import type { Asset, AssetSeriesPoint, AssetTicker, AssetTimeframe } from "@/lib/types/asset";

export const TIMEFRAMES: readonly AssetTimeframe[] = ["1H", "1D", "1W", "1M", "1Y", "All"] as const;

// Suffix copy shown next to the trend chip on the asset detail screen.
export const TIMEFRAME_LABELS: Readonly<Record<AssetTimeframe, string>> = {
  "1H": "last 1 hour",
  "1D": "last 24 hour",
  "1W": "last week",
  "1M": "last month",
  "1Y": "last year",
  "All": "all time",
};

// Kept uniform across timeframes because `LineChart.Line`'s `animate` prop
// interpolates point-by-point — source and destination arrays must match length.
const TIMEFRAME_POINT_COUNT = 64 as const;

// Peak-to-peak swing as a fraction of price per timeframe.
const TIMEFRAME_VOLATILITY: Readonly<Record<AssetTimeframe, number>> = {
  "1H": 0.01,
  "1D": 0.03,
  "1W": 0.07,
  "1M": 0.15,
  "1Y": 0.4,
  "All": 0.85,
};

// FNV-1a–style mixer that stays in 32-bit space; pure, no global state,
// fast enough to run during module evaluation.
const hashString = (input: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash = Math.imul(hash ^ input.charCodeAt(i), 16777619);
  }
  return hash >>> 0;
};

// Deterministic, gently oscillating series drifting toward `change`
// (positive => upward bias, negative => downward bias). The slow sine + faster
// harmonic + linear drift combination reads as a believable price curve.
const generateSeries = (
  ticker: AssetTicker,
  timeframe: AssetTimeframe,
  basePrice: number,
  change: number,
): readonly AssetSeriesPoint[] => {
  const count = TIMEFRAME_POINT_COUNT;
  const volatility = TIMEFRAME_VOLATILITY[timeframe];
  const seed = hashString([ticker, timeframe].join(":"));
  const phase = (seed % 360) * (Math.PI / 180);
  const harmonicPhase = ((seed >>> 8) % 360) * (Math.PI / 180);
  const drift = change * basePrice;
  const points: AssetSeriesPoint[] = [];
  for (let i = 0; i < count; i += 1) {
    const t = i / (count - 1);
    const sine = Math.sin(phase + t * Math.PI * 2);
    const harmonic = Math.sin(harmonicPhase + t * Math.PI * 6) * 0.35;
    const wave = (sine + harmonic) * volatility * basePrice * 0.5;
    const value = basePrice + drift * t + wave;
    points.push({ x: i, value: Number(value.toFixed(4)) });
  }
  return points;
};

const buildSeriesByTimeframe = (
  ticker: AssetTicker,
  basePrice: number,
  changeByTimeframe: Readonly<Record<AssetTimeframe, number>>,
): Readonly<Record<AssetTimeframe, readonly AssetSeriesPoint[]>> => {
  return TIMEFRAMES.reduce<Record<AssetTimeframe, readonly AssetSeriesPoint[]>>(
    (acc, timeframe) => {
      acc[timeframe] = generateSeries(ticker, timeframe, basePrice, changeByTimeframe[timeframe]);
      return acc;
    },
    {} as Record<AssetTimeframe, readonly AssetSeriesPoint[]>,
  );
};

interface AssetSeed {
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
}

const ASSET_SEEDS: readonly AssetSeed[] = [
  {
    id: "btc",
    name: "Bitcoin",
    ticker: "BTC",
    price: 67234.18,
    changeByTimeframe: {
      "1H": 0.0021,
      "1D": 0.0214,
      "1W": 0.053,
      "1M": 0.124,
      "1Y": 0.582,
      "All": 112.4,
    },
    marketCap: 1_320_000_000_000,
    volume24h: 38_400_000_000,
    circulatingSupply: 19_720_000,
    ath: 73_835.57,
    description: [
      "Bitcoin is the first decentralized peer-to-peer electronic cash system,",
      "launched in 2009 by the pseudonymous Satoshi Nakamoto. Its proof-of-work",
      "consensus and capped supply of 21 million coins make it the most widely",
      "held digital store of value, often referred to as digital gold. The",
      "Lightning Network and other Layer 2 protocols extend Bitcoin into fast,",
      "low-cost payments without compromising the base layer's security.",
    ].join(" "),
    isFavorite: true,
  },
  {
    id: "eth",
    name: "Ethereum",
    ticker: "ETH",
    price: 3512.42,
    changeByTimeframe: {
      "1H": 0.0032,
      "1D": 0.0381,
      "1W": 0.0785,
      "1M": 0.182,
      "1Y": 0.645,
      "All": 189.0,
    },
    marketCap: 423_500_000_000,
    volume24h: 17_200_000_000,
    circulatingSupply: 120_280_000,
    ath: 4_891.7,
    description: [
      "Ethereum is a decentralized smart-contract platform that powers the",
      "largest ecosystem of decentralized applications, stablecoins, and",
      "tokenized real-world assets. Since transitioning to proof-of-stake, the",
      "network is secured by validators staking ETH rather than miners burning",
      "energy. A thriving Layer 2 ecosystem — including Arbitrum, Base, and",
      "Optimism — scales Ethereum to millions of low-cost transactions per day.",
    ].join(" "),
    isFavorite: true,
  },
  {
    id: "sol",
    name: "Solana",
    ticker: "SOL",
    price: 168.91,
    changeByTimeframe: {
      "1H": 0.0042,
      "1D": 0.0517,
      "1W": 0.112,
      "1M": 0.248,
      "1Y": 4.123,
      "All": 841.5,
    },
    marketCap: 78_900_000_000,
    volume24h: 3_410_000_000,
    circulatingSupply: 466_000_000,
    ath: 259.96,
    description: [
      "Solana is a high-throughput Layer 1 blockchain that pairs proof-of-stake",
      "with a novel proof-of-history clock to deliver sub-second finality and",
      "tens of thousands of transactions per second. Its low fees and high",
      "speed have made it a natural home for consumer applications, on-chain",
      "order books, payments, and one of the most active NFT and meme-coin",
      "economies in crypto.",
    ].join(" "),
    isFavorite: true,
  },
  {
    id: "usdc",
    name: "USD Coin",
    ticker: "USDC",
    price: 1.0,
    changeByTimeframe: {
      "1H": 0.00001,
      "1D": 0.0002,
      "1W": -0.0005,
      "1M": 0.0008,
      "1Y": -0.0034,
      "All": 0.17,
    },
    marketCap: 33_700_000_000,
    volume24h: 7_600_000_000,
    circulatingSupply: 33_700_000_000,
    ath: 1.17,
    description: [
      "USDC is a fully reserved, dollar-backed stablecoin issued by Circle and",
      "backed 1:1 by cash and short-dated U.S. Treasury securities held with",
      "regulated financial institutions. It is designed for fast, low-cost",
      "on-chain payments, cross-border remittances, and treasury operations,",
      "and is natively issued on more than a dozen leading blockchains with",
      "frequent third-party attestations on the underlying reserves.",
    ].join(" "),
    isFavorite: false,
  },
  {
    id: "ada",
    name: "Cardano",
    ticker: "ADA",
    price: 0.4521,
    changeByTimeframe: {
      "1H": -0.0018,
      "1D": -0.0186,
      "1W": -0.0342,
      "1M": -0.068,
      "1Y": 0.289,
      "All": 9.2,
    },
    marketCap: 16_400_000_000,
    volume24h: 460_000_000,
    circulatingSupply: 35_900_000_000,
    ath: 3.09,
    description: [
      "Cardano is a research-driven proof-of-stake blockchain whose protocol",
      "is grounded in peer-reviewed academic research and formal verification.",
      "Its layered architecture cleanly separates settlement from computation,",
      "supporting smart contracts written in Plutus, native multi-asset",
      "tokens, and on-chain identity primitives. The project's long-term",
      "roadmap emphasises governance, regulatory clarity, and emerging-market",
      "adoption.",
    ].join(" "),
    isFavorite: false,
  },
  {
    id: "doge",
    name: "Dogecoin",
    ticker: "DOGE",
    price: 0.1487,
    changeByTimeframe: {
      "1H": 0.0011,
      "1D": 0.0124,
      "1W": -0.023,
      "1M": 0.046,
      "1Y": 0.928,
      "All": 94.2,
    },
    marketCap: 21_500_000_000,
    volume24h: 820_000_000,
    circulatingSupply: 144_000_000_000,
    ath: 0.7376,
    description: [
      "Dogecoin began as an internet meme in 2013 and grew into one of the",
      "most widely used proof-of-work payment networks, with one-minute block",
      "times, low fees, and a famously friendly community. Merge-mined with",
      "Litecoin for additional security, Dogecoin is increasingly used for",
      "tipping, micropayments, and merchant checkout integrations, and remains",
      "a cultural touchstone for retail adoption of crypto.",
    ].join(" "),
    isFavorite: false,
  },
  {
    id: "link",
    name: "Chainlink",
    ticker: "LINK",
    price: 18.54,
    changeByTimeframe: {
      "1H": -0.0006,
      "1D": -0.0072,
      "1W": 0.0185,
      "1M": -0.042,
      "1Y": -0.184,
      "All": 53.1,
    },
    marketCap: 11_900_000_000,
    volume24h: 510_000_000,
    circulatingSupply: 626_000_000,
    ath: 52.7,
    description: [
      "Chainlink is the leading decentralized oracle network, securely",
      "connecting smart contracts to real-world market data, off-chain",
      "computation, and external APIs. Its price feeds underpin a large share",
      "of the DeFi economy, while newer services — including verifiable random",
      "functions, the Cross-Chain Interoperability Protocol (CCIP), and",
      "proof-of-reserve attestations — extend Chainlink into mainstream",
      "financial infrastructure.",
    ].join(" "),
    isFavorite: false,
  },
];

export const MOCK_ASSETS: readonly Asset[] = ASSET_SEEDS.map((seed) => ({
  ...seed,
  seriesByTimeframe: buildSeriesByTimeframe(seed.ticker, seed.price, seed.changeByTimeframe),
}));

export const MOCK_FAVORITE_ASSETS: readonly Asset[] = MOCK_ASSETS.filter(
  (asset) => asset.isFavorite,
);

export const findAssetById = (id: string | undefined): Asset | undefined => {
  if (typeof id !== "string" || id.length === 0) {
    return undefined;
  }
  return MOCK_ASSETS.find((asset) => asset.id === id);
};
