type Lock = {
  userId: string;
  base: string;
  quote: string;
  side: "BUY" | "SELL";
  lockedBase: number;
  lockedQuote: number;
  remaining: number;
};

const locks = new Map<number, Lock>();

export const createLock = (orderId: number, lock: Lock) => {
  locks.set(orderId, lock);
};

export const getLock = (orderId: number) => {
  return locks.get(orderId);
};

export const removeLock = (orderId: number) => {
  locks.delete(orderId);
};