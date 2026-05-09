import { Price, Quantity, Timestamp, MarketSymbol } from "./types.js";

export class Trade {
  public id: number;

  public symbol: MarketSymbol;

  public price: Price;
  public quantity: Quantity;

  public buyerId: string;
  public sellerId: string;

  public buyOrderId: number;
  public sellOrderId: number;
  public buyOrderDbId: string;
  public sellOrderDbId: string;
  public buyOrderRemaining: number;
  public sellOrderRemaining: number;

  public timestamp: Timestamp;

  constructor(params: {
    id: number;
    symbol: MarketSymbol;
    price: Price;
    quantity: Quantity;
    buyerId: string;
    sellerId: string;
    buyOrderId: number;
    sellOrderId: number;
    buyOrderDbId: string;
    sellOrderDbId: string;
    buyOrderRemaining: number;
    sellOrderRemaining: number;
    timestamp: Timestamp;
  }) {
    this.id = params.id;

    this.symbol = params.symbol;

    this.price = params.price;
    this.quantity = params.quantity;

    this.buyerId = params.buyerId;
    this.sellerId = params.sellerId;

    this.buyOrderId = params.buyOrderId;
    this.sellOrderId = params.sellOrderId;
    this.buyOrderDbId = params.buyOrderDbId;
    this.sellOrderDbId = params.sellOrderDbId;
    this.buyOrderRemaining = params.buyOrderRemaining;
    this.sellOrderRemaining = params.sellOrderRemaining;

    this.timestamp = params.timestamp;
  }
}
