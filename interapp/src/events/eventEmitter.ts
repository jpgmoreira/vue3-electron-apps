type Listener = (...args: any[]) => void | Promise<void>;

export class EventEmitter {
  private listeners = new Map<string, Listener[]>();

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

  async emit(event: string, ...args: any[]): Promise<void> {
    const arr = this.listeners.get(event);
    if (!arr) return;
    for (const l of arr) {
      await l(...args);
    }
  }
}
