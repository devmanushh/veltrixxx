import { eventBus } from "../events/eventEmitter.js";
import { TRADE_EVENT, type TradeEventPayload } from "../events/tradeEvents.js";
import { broadcast } from "./wsServer.js";
import { addRecentTrade } from "./tradeCache.js";

eventBus.on<TradeEventPayload>(TRADE_EVENT, async ({ trade }) => {
  const item = addRecentTrade(trade);

  broadcast(trade.symbol, {
    type: "TRADE_UPDATE",
    data: item,
  });
});
