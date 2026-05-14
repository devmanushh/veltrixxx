export const parseMarketAssets = (symbol: string) => {
  const normalized = symbol.toUpperCase();

  if (normalized.includes("-")) {
    const [base, quote] = normalized.split("-");
    return { base, quote };
  }

  if (normalized.includes("/")) {
    const [base, quote] = normalized.split("/");
    return { base, quote };
  }

  const knownQuotes = ["USDT", "DEV", "USD"];
  const quote = knownQuotes.find((asset) => normalized.endsWith(asset));

  if (quote) {
    return {
      base: normalized.slice(0, -quote.length),
      quote,
    };
  }

  return {
    base: normalized.slice(0, Math.max(normalized.length - 3, 0)),
    quote: normalized.slice(-3),
  };
};
