type Balance = {
  free: number;
  locked: number;
};

/**
 * userId → (asset → balance)
 */
const balances: Map<string, Map<string, Balance>> = new Map();

/**
 * Get or create balance
 */
export const getBalance = (
  userId: string,
  asset: string
): Balance => {
  if (!balances.has(userId)) {
    balances.set(userId, new Map());
  }

  const userBalances = balances.get(userId)!;

  if (!userBalances.has(asset)) {
    userBalances.set(asset, { free: 0, locked: 0 });
  }

  return userBalances.get(asset)!;
};

/**
 * Helper: set balance (for testing / initial funding)
 */
export const setBalance = (
  userId: string,
  asset: string,
  amount: number
) => {
  const bal = getBalance(userId, asset);
  bal.free = amount;
  bal.locked = 0;
};

/**
 * Debug helper
 */
export const getUserBalances = (userId: string) => {
  return balances.get(userId) || new Map();
};