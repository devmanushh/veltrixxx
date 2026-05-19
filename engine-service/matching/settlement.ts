import { getBalance } from "../stores/balanceStore.js";
import { Trade } from "./Trade.js";
import { getLock } from "../stores/orderLockStore.js";
import { parseMarketAssets } from "../../packages/utils/parseMarketAssets.js";

/**
 * Apply balance changes after trade execution
 */
export const settleTrade = (trade: Trade) => {
  const { base, quote } = parseMarketAssets(trade.symbol);

  const {
    buyerId,
    sellerId,
    price,
    quantity
  } = trade;

  const cost = price * quantity;
  const buyerLock = getLock(trade.buyOrderId);
  const sellerLock = getLock(trade.sellOrderId);

  if (buyerLock) {
    buyerLock.lockedQuote -= cost;
    buyerLock.remaining -= quantity;
  }

  if (sellerLock) {
    sellerLock.lockedBase -= quantity;
    sellerLock.remaining -= quantity;
  }

  // -------------------------
  // BUYER SIDE
  // -------------------------

  const buyerQuote = getBalance(buyerId, quote); // USDT
  const buyerBase = getBalance(buyerId, base);   // BTC

  // deduct locked quote
  buyerQuote.locked -= cost;

  // credit base asset
  buyerBase.free += quantity;

  // -------------------------
  // SELLER SIDE
  // -------------------------

  const sellerBase = getBalance(sellerId, base);
  const sellerQuote = getBalance(sellerId, quote);

  // deduct locked base
  sellerBase.locked -= quantity;

  // credit quote
  sellerQuote.free += cost;

  // -------------------------
  // SAFETY CHECK (optional)
  // -------------------------

  if (buyerQuote.locked < 0) buyerQuote.locked = 0;
  if (sellerBase.locked < 0) sellerBase.locked = 0;
};
