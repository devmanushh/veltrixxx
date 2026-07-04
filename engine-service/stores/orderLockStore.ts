type Lock = {
  userId: string;
  base: string;
  quote: string;
  side: "BUY" | "SELL";
  lockedBase: number;
  lockedQuote: number;
  remaining: number;
};

const locks = new Map<string, Lock>();

export const createLock = (orderId: string, lock: Lock) => {
  locks.set(orderId, lock);
};

export const getLock = (orderId: string) => {
  return locks.get(orderId);
};

export const removeLock = (orderId: string) => {
  locks.delete(orderId);
};
