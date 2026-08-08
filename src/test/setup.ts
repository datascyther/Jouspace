import "@testing-library/jest-dom";

// jsdom's localStorage can be unavailable for opaque origins; provide a
// deterministic in-memory polyfill so persistence logic is testable.
class LocalStorageMock {
  private store = new Map<string, string>();
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  get length(): number {
    return this.store.size;
  }
}

const ls = new LocalStorageMock();
Object.defineProperty(globalThis, "localStorage", {
  value: ls,
  configurable: true,
});
try {
  Object.defineProperty(window, "localStorage", { value: ls, configurable: true });
} catch {
  /* window may be read-only; globalThis is enough for the store */
}
