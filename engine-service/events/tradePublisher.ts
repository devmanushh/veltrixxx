import { eventBus } from "./eventEmitter.js";
import { TRADE_EVENT, TradeEventPayload } from "./tradeEvents.js";
import { publish } from "../queue/publisher.js";

const TRADE_CHANNEL = "trades";

eventBus.on<TradeEventPayload>(TRADE_EVENT, async ({ trade }) => {
  await publish(TRADE_CHANNEL, trade);
});