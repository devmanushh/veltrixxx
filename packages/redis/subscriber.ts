export const subscribeOrders = () => {
  throw new Error("Order delivery uses Redis Streams. Use the engine stream consumer instead of pub/sub subscribers.");
};

export const subscribeTrades = () => {
  throw new Error("Trade delivery uses Redis Streams. Use the trade stream consumer instead of pub/sub subscribers.");
};