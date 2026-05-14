import WebSocket, { WebSocketServer } from "ws";
import { getSnapshot } from "./snapshotCache.js";
import { getSeq } from "./sequence.js";
import { getCandlesBySymbol } from "../candles/candleStore.js";
import { getRecentTrades } from "./tradeCache.js";

const port = Number(process.env.WS_PORT ?? process.env.PORT ?? 8080);
const wss = new WebSocketServer({ port });

console.log(`WebSocket server running on port ${port}`);

const clients: Map<string, Set<WebSocket>> = new Map();

wss.on("connection", (ws: WebSocket) => {
  let subscribedSymbol: string | null = null;

  ws.on("message", (msg: Buffer) => {
    try {
      const data = JSON.parse(msg.toString());

      if (data.type === "SUBSCRIBE") {
  subscribedSymbol = String(data.symbol || "");

  if (!subscribedSymbol) {
    return;
  }

  if (!clients.has(subscribedSymbol)) {
    clients.set(subscribedSymbol, new Set());
  }

  clients.get(subscribedSymbol)!.add(ws);

  // 🔥 SEND SNAPSHOT
  const snapshot = getSnapshot(subscribedSymbol);

  ws.send(
    JSON.stringify({
      type: "ORDERBOOK_SNAPSHOT",
      seq: getSeq(subscribedSymbol),
      data: {
        bids: Array.from(snapshot.bids.entries()),
        asks: Array.from(snapshot.asks.entries())
      }
    })
  );

  ws.send(
    JSON.stringify({
      type: "CANDLE_SNAPSHOT",
      data: getCandlesBySymbol(subscribedSymbol),
    })
  );

  ws.send(
    JSON.stringify({
      type: "TRADE_SNAPSHOT",
      data: getRecentTrades(subscribedSymbol),
    })
  );
}
    } catch {}
  });

  ws.on("close", () => {
    if (subscribedSymbol) {
      clients.get(subscribedSymbol)?.delete(ws);
    }
  });
});

export const broadcast = (symbol: string, payload: unknown) => {
  const subs = clients.get(symbol);
  if (!subs) return;

  for (const ws of subs) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }
};
