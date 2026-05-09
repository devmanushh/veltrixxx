export type Trade = {
  id: string;
  buyerId: string;
  sellerId: string;
  symbol: string;
  price: number;
  quantity: number;
  createdAt?: Date;
  timestamp?: number;
};
