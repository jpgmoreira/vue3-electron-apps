type Listener = (...args: any[]) => void;

/**
 * Singleton for emitting and listening to events.
 * Access via EventEmitter.instance
 */
export class EventEmitter {
  static #instance: EventEmitter;

  private listeners = new Map<string, Listener[]>();

  private constructor() {}

  public static get instance(): EventEmitter {
    if (!this.#instance) {
      this.#instance = new EventEmitter();
    }
    return this.#instance;
  }

  on(event: string, listener: Listener) {
    const arr = this.listeners.get(event) ?? [];
    arr.push(listener);
    this.listeners.set(event, arr);
  }

  off(event: string, listener: Listener): void {
    const arr = this.listeners.get(event);
    if (!arr) return;
    this.listeners.set(
      event,
      arr.filter((l) => l !== listener)
    );
  }

  emit(event: string, ...args: any[]): void {
    const arr = this.listeners.get(event);
    if (!arr) return;
    arr.forEach((l) => l(...args));
  }
}
