import { Order } from "./Order.js";

/**
 * Internal node for doubly linked list
 */
class OrderNode {
  public order: Order;
  public next: OrderNode | null = null;
  public prev: OrderNode | null = null;

  constructor(order: Order) {
    this.order = order;
  }
}

/**
 * PriceLevel = FIFO queue of orders at same price
 */
export class PriceLevel {
  public price: number;

  private head: OrderNode | null = null;
  private tail: OrderNode | null = null;

  private size: number = 0;

  /**
   * Map for O(1) lookup → orderId → node
   */
  private orderMap: Map<number, OrderNode> = new Map();

  constructor(price: number) {
    this.price = price;
  }

  /**
   * Add order to tail (FIFO)
   */
  add(order: Order) {
    const node = new OrderNode(order);

    if (!this.head) {
      this.head = this.tail = node;
    } else {
      node.prev = this.tail;
      this.tail!.next = node;
      this.tail = node;
    }

    this.orderMap.set(order.id, node);
    this.size++;
  }

  /**
   * Get best order (head)
   */
  peek(): Order | null {
    return this.head?.order || null;
  }

  /**
   * Remove head (used in matching)
   */
  shift(): Order | null {
    if (!this.head) return null;

    const node = this.head;

    this.head = node.next;

    if (this.head) {
      this.head.prev = null;
    } else {
      this.tail = null;
    }

    this.orderMap.delete(node.order.id);
    this.size--;

    return node.order;
  }

  /**
   * Remove specific order (cancel)
   */
  remove(orderId: number): boolean {
    const node = this.orderMap.get(orderId);
    if (!node) return false;

    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }

    this.orderMap.delete(orderId);
    this.size--;

    return true;
  }

  /**
   * Check if empty
   */
  isEmpty(): boolean {
    return this.size === 0;
  }

  /**
   * Get number of orders
   */
  getSize(): number {
    return this.size;
  }

  /**
   * Iterate (useful for snapshot)
   */
  *[Symbol.iterator](): IterableIterator<Order> {
    let current = this.head;
    while (current) {
      yield current.order;
      current = current.next;
    }
  }
}