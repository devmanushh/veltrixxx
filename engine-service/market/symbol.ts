export const parseMarketAssets = (symbol: string) => {
  if (symbol.includes("-")) {
    const [base, quote] = symbol.split("-");
    return { base, quote };
  }

  if (symbol.includes("/")) {
    const [base, quote] = symbol.split("/");
    return { base, quote };
  }

  const knownQuotes = ["USDT", "DEV", "USD"];
  const quote = knownQuotes.find((asset) => symbol.toUpperCase().endsWith(asset));

  if (quote) {
    return {
      base: symbol.slice(0, -quote.length).toUpperCase(),
      quote,
    };
  }

  return {
    base: symbol.slice(0, Math.max(symbol.length - 3, 0)).toUpperCase(),
    quote: symbol.slice(-3).toUpperCase(),
  };
};
