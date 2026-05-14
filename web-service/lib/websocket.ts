type WSMessageHandler = (data: any) => void;

export type OrderBookLevel = [number, number];

export type OrderBookSnapshotMessage = {
  type: "ORDERBOOK_SNAPSHOT";
  seq: number;
  data: {
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
  };
};

export type OrderBookDiffMessage = {
  type: "ORDERBOOK_DIFF";
  seq: number;
  data: {
    symbol: string;
    side: "BUY" | "SELL";
    price: number;
    quantity: number;
  };
};

export type TradeTapeItem = {
  id: number;
  symbol: string;
  price: number;
  quantity: number;
  side: "BUY" | "SELL";
  timestamp: number;
};

export type TradeSnapshotMessage = {
  type: "TRADE_SNAPSHOT";
  data: TradeTapeItem[];
};

export type TradeUpdateMessage = {
  type: "TRADE_UPDATE";
  data: TradeTapeItem;
};

const getWebSocketUrl = () => {
  const configuredUrl = process.env.NEXT_PUBLIC_WS_URL?.trim() || "ws://localhost:8080";

  return configuredUrl
    .replace(/^https:\/\//, "wss://")
    .replace(/^http:\/\//, "ws://");
};

export const connectWS = (symbol: string, onMessage?: WSMessageHandler) => {
  const ws = new WebSocket(getWebSocketUrl());

  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        type: "SUBSCRIBE",
        symbol
      })
    );
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    onMessage?.(data);
  };

  return ws;
};
