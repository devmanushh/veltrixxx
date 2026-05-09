type WSMessageHandler = (data: any) => void;

export const connectWS = (symbol: string, onMessage?: WSMessageHandler) => {
  const ws = new WebSocket("ws://localhost:8080");

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
