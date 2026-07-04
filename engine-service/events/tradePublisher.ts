import { eventBus } from "./eventEmitter.js";
import { TRADE_EVENT, TradeEventPayload } from "./tradeEvents.js";
import { publishTradeEvent } from "../queue/publisher.js";

eventBus.on<TradeEventPayload>(TRADE_EVENT, async ({ trade }) => {
  try {
    await publishTradeEvent(trade);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("Trade stream publish failed:", message);
  }
});