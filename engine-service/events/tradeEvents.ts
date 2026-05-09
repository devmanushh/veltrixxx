import { Trade } from "../engine/Trade.js";

export const TRADE_EVENT = "trade";

export type TradeEventPayload = {
  trade: Trade;
};