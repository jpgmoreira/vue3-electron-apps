type Listener = (...args: any[]) => void;

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

  emit(event: string, ...args: any[]): void {
    const arr = this.listeners.get(event);
    if (!arr) return;
    arr.forEach((l) => l(...args));
  }
}
