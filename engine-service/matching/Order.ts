import {
  OrderSide,
  OrderType,
  OrderStatus,
  Price,
  Quantity,
  Timestamp,
  MarketSymbol
} from "./types.js";

export class Order {
  public id: string;
  public dbId: string;
  public userId: string;
  public symbol: MarketSymbol;

  public side: OrderSide;
  public type: OrderType;

  public price: Price | null; // null for MARKET
  public quantity: Quantity;
  public remaining: Quantity;

  public status: OrderStatus;

  public createdAt: Timestamp;

  constructor(params: {
    id: string;
    dbId?: string;
    userId: string;
    symbol: MarketSymbol;
    side: OrderSide;
    type: OrderType;
    price?: Price | null;
    quantity: Quantity;
    timestamp: Timestamp;
  }) {
    this.id = params.id;
    this.dbId = params.dbId ?? String(params.id);
    this.userId = params.userId;
    this.symbol = params.symbol;

    this.side = params.side;
    this.type = params.type;

    this.price = params.price ?? null;
    this.quantity = params.quantity;
    this.remaining = params.quantity;

    this.status = "OPEN";

    this.createdAt = params.timestamp;
  }

  isFilled(): boolean {
    return this.remaining === 0;
  }

  isActive(): boolean {
    return this.status === "OPEN" || this.status === "PARTIALLY_FILLED";
  }

  fill(qty: Quantity) {
    if (qty > this.remaining) {
      throw new Error("Overfill attempt");
    }

    this.remaining -= qty;

    if (this.remaining === 0) {
      this.status = "FILLED";
    } else {
      this.status = "PARTIALLY_FILLED";
    }
  }

  cancel() {
    if (this.isFilled()) return;
    this.status = "CANCELLED";
  }
}
