export const CHANNELS = {
  ORDERS: "orders",
  TRADES: "trades",
};

export const STREAMS = {
  ORDER_COMMANDS: "veltrix:order_commands",
  TRADE_EVENTS: "veltrix:trade_events",
};

export const GROUPS = {
  ENGINE_ORDERS: "veltrix-engine",
  TRADE_PERSISTENCE: "veltrix-trade-persistence",
};

export const ORDER_COMMAND_TYPES = {
  PLACE: "PLACE_ORDER",
  CANCEL: "CANCEL_ORDER",
} as const;

export const ENGINE_EVENT_TYPES = {
  TRADE: "TRADE",
} as const;