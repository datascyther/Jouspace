// Polyfill React Native globals expected by the web wrapper / app code.
(globalThis as any).__DEV__ = true;
(globalThis as any).process = (globalThis as any).process || { env: {} };
(globalThis as any).process.env.NODE_ENV = 'test';

// Minimal ExpoGlobal polyfill (expo-modules-core reads globalThis.ExpoGlobal.EventEmitter).
class FakeEventEmitter {
  addListener() { return { remove: () => {} }; }
  removeListener() {}
  removeAllListeners() {}
  emit() {}
  listenerCount() { return 0; }
}
(globalThis as any).ExpoGlobal = (globalThis as any).ExpoGlobal || {
  EventEmitter: FakeEventEmitter,
  default: {},
};

