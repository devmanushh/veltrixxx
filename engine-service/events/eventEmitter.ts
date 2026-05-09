type EventHandler<T = any> = (payload: T) => void | Promise<void>;

export class EventEmitter {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  on<T>(event: string, handler: EventHandler<T>) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler) {
    this.listeners.get(event)?.delete(handler);
  }

  async emit<T>(event: string, payload: T) {
    const handlers = this.listeners.get(event);
    if (!handlers) return;

    // run all handlers async (non-blocking)
    await Promise.allSettled(
      Array.from(handlers).map((handler) => handler(payload))
    );
  }
}

// singleton
export const eventBus = new EventEmitter();