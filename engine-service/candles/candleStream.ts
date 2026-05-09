import { eventBus } from "../events/eventEmitter.js";
import { TRADE_EVENT } from "../events/tradeEvents.js";
import type { TradeEventPayload } from "../events/tradeEvents.js";
import { broadcast } from "../ws/wsServer.js";
import { updateCandleFromTrade } from "./candleBuilder.js";

const intervals = ["1m", "5m", "15m", "1h"] as const;

eventBus.on<TradeEventPayload>(TRADE_EVENT, async ({ trade }) => {
  for (const interval of intervals) {
    const candle = updateCandleFromTrade(trade, interval);

    broadcast(trade.symbol, {
      type: "CANDLE_UPDATE",
      data: candle,
    });
  }
});
