import { eventBus } from "../events/eventEmitter.js";
import { TRADE_EVENT } from "../events/tradeEvents.js";
import type { TradeEventPayload } from "../events/tradeEvents.js";
import { broadcast } from "../ws/wsServer.js";
import { updateCandleFromTrade } from "./candleBuilder.js";
import { upsertCandle } from "../../packages/db/index.js";

const intervals = ["1m", "5m", "15m", "1h"] as const;

eventBus.on<TradeEventPayload>(TRADE_EVENT, async ({ trade }) => {
  for (const interval of intervals) {
    const candle = updateCandleFromTrade(trade, interval);

    void upsertCandle(candle).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : "Unknown candle persistence error";
      console.warn(`Failed to persist ${trade.symbol} ${interval} candle: ${message}`);
    });

    broadcast(trade.symbol, {
      type: "CANDLE_UPDATE",
      data: candle,
    });
  }
});
