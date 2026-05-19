import { Trade } from "../matching/Trade.js";

export const TRADE_EVENT = "trade";

export type TradeEventPayload = {
  trade: Trade;
};