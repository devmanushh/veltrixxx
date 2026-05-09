const sequences: Map<string, number> = new Map();

export const nextSeq = (symbol: string): number => {
  const current = sequences.get(symbol) || 0;
  const next = current + 1;
  sequences.set(symbol, next);
  return next;
};

export const getSeq = (symbol: string): number => {
  return sequences.get(symbol) || 0;
};