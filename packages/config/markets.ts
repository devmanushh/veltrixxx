export type MarketKind = "spot" | "futures";

export type MarketStats = {
  change: string;
  changePercent: string;
  high: string;
  low: string;
  volumeUsd: string;
};

export type MarketConfig = {
  symbol: string;
  apiSymbol: string;
  base: string;
  quote: string;
  displaySymbol: string;
  selectorLabel: string;
  price: string;
  leverage?: string;
  stats: MarketStats;
};

export const normalizeMarketApiSymbol = (symbol: string) =>
  symbol.toLowerCase().replace(/[^a-z0-9]/g, "");

const sharedStats: Record<string, MarketStats> = {
  BTC: {
    change: "+292.4",
    changePercent: "+0.36%",
    high: "82,813.1",
    low: "80,746.9",
    volumeUsd: "5,984,516.74",
  },
  ETH: {
    change: "+41.8",
    changePercent: "+1.28%",
    high: "3,422.6",
    low: "3,301.4",
    volumeUsd: "3,186,084.11",
  },
  SOL: {
    change: "+1.94",
    changePercent: "+2.31%",
    high: "86.24",
    low: "82.01",
    volumeUsd: "984,210.09",
  },
  XRP: {
    change: "-0.02",
    changePercent: "-0.74%",
    high: "2.18",
    low: "2.05",
    volumeUsd: "812,774.65",
  },
  DOGE: {
    change: "+0.004",
    changePercent: "+1.90%",
    high: "0.219",
    low: "0.204",
    volumeUsd: "544,901.22",
  },
  ADA: {
    change: "+0.013",
    changePercent: "+2.05%",
    high: "0.663",
    low: "0.621",
    volumeUsd: "402,118.93",
  },
  AVAX: {
    change: "-0.31",
    changePercent: "-0.89%",
    high: "36.20",
    low: "34.42",
    volumeUsd: "361,775.18",
  },
  LINK: {
    change: "+0.44",
    changePercent: "+2.68%",
    high: "17.12",
    low: "16.02",
    volumeUsd: "285,913.74",
  },
  SUI: {
    change: "+0.08",
    changePercent: "+2.33%",
    high: "3.58",
    low: "3.31",
    volumeUsd: "219,608.45",
  },
  BNB: {
    change: "+6.80",
    changePercent: "+0.91%",
    high: "761.4",
    low: "736.8",
    volumeUsd: "642,889.32",
  },
};

const prices: Record<string, string> = {
  BTC: "81,589.0",
  ETH: "3,386.2",
  SOL: "84.37",
  XRP: "2.12",
  DOGE: "0.1098",
  ADA: "0.648",
  AVAX: "35.12",
  LINK: "16.84",
  SUI: "3.49",
  BNB: "748.6",
};

const bases = ["BTC", "ETH", "SOL", "XRP", "DOGE", "ADA", "AVAX", "LINK", "SUI", "BNB"] as const;

export const SPOT_MARKETS: MarketConfig[] = bases.map((base) => ({
  symbol: `${base}USDT`,
  apiSymbol: normalizeMarketApiSymbol(`${base}USDT`),
  base,
  quote: "USDT",
  displaySymbol: `${base}/USDT`,
  selectorLabel: `${base}/USDT`,
  price: prices[base],
  leverage: base === "BTC" ? "8x" : undefined,
  stats: sharedStats[base],
}));

export const FUTURES_MARKETS: MarketConfig[] = bases.map((base) => ({
  symbol: `${base}DEV`,
  apiSymbol: normalizeMarketApiSymbol(`${base}DEV`),
  base,
  quote: "DEV",
  displaySymbol: `${base}DEV`,
  selectorLabel: `${base}DEV`,
  price: prices[base],
  leverage: "8x",
  stats: sharedStats[base],
}));

export const MARKETS = [...SPOT_MARKETS, ...FUTURES_MARKETS].map((market) => market.symbol);
export type MarketSymbol = (typeof MARKETS)[number];

export const getMarketsByKind = (kind: MarketKind) =>
  kind === "spot" ? SPOT_MARKETS : FUTURES_MARKETS;

export const getMarketBySymbol = (kind: MarketKind, symbol: string) => {
  const markets = getMarketsByKind(kind);
  return markets.find((market) => market.symbol === symbol) || markets[0];
};

export const getMarketByApiSymbol = (kind: MarketKind, apiSymbol: string) => {
  const markets = getMarketsByKind(kind);
  const normalizedApiSymbol = normalizeMarketApiSymbol(apiSymbol);

  return (
    markets.find((market) => market.apiSymbol === normalizedApiSymbol) ||
    markets.find((market) => normalizeMarketApiSymbol(market.symbol) === normalizedApiSymbol) ||
    markets[0]
  );
};

export const getDefaultMarket = (kind: MarketKind) => getMarketsByKind(kind)[0];

export const getMarketRoutePath = (kind: MarketKind, market: Pick<MarketConfig, "apiSymbol">) =>
  `/${kind === "spot" ? "spot" : "future"}/${market.apiSymbol}`;

export const getOrderEndpointPath = (kind: MarketKind, market: Pick<MarketConfig, "apiSymbol">) => {
  if (kind !== "spot") {
    throw new Error("Futures orders are not supported until positions, margin, funding, and liquidation are modeled.");
  }

  return `${getMarketRoutePath(kind, market)}/order`;
};
