type BookSide = Map<number, number>;

type Snapshot = {
  bids: BookSide;
  asks: BookSide;
};

const snapshots: Map<string, Snapshot> = new Map();

export const getSnapshot = (symbol: string): Snapshot => {
  if (!snapshots.has(symbol)) {
    snapshots.set(symbol, {
      bids: new Map(),
      asks: new Map()
    });
  }

  return snapshots.get(symbol)!;
};