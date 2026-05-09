type WSMessageHandler = (data: any) => void;

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

    if (data.type === "ORDERBOOK_SNAPSHOT") {
      console.log("SNAPSHOT", data);
    }

    if (data.type === "ORDERBOOK_DIFF") {
      console.log("DIFF", data);
    }
  };

  return ws;
};
