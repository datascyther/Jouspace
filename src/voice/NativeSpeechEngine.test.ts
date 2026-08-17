import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NativeSpeechEngine } from './NativeSpeechEngine';

/** Controllable fake for the speech-recognition plugin. Listener callbacks are
 *  captured so the test can fire `partialResults` / `listeningState` events. */
const fake = vi.hoisted(() => {
  const listeners: Record<string, ((data: any) => void)[]> = {
    partialResults: [],
    listeningState: [],
  };
  const plugin: any = {
    available: async () => ({ available: true }),
    checkPermissions: async () => ({ speechRecognition: 'granted' }),
    requestPermissions: async () => ({ speechRecognition: 'granted' }),
    start: async () => ({ matches: [] as string[] }),
    stop: async () => {},
    addListener: async (event: string, cb: (data: any) => void) => {
      (listeners[event] ??= []).push(cb);
      return { remove: async () => {} };
    },
    removeAllListeners: vi.fn(async () => {}),
    listeners,
  };
  return { plugin, listeners };
});

vi.mock('@capacitor-community/speech-recognition', () => ({
  get SpeechRecognition() {
    return fake.plugin;
  },
}));

beforeEach(() => {
  (window as any).Capacitor = { isNativePlatform: () => true };
  fake.listeners.partialResults = [];
  fake.listeners.listeningState = [];
  fake.plugin.available = async () => ({ available: true });
});

function makeEngine() {
  const eng = new NativeSpeechEngine();
  const cb = {
    onResult: vi.fn(),
    onInterim: vi.fn(),
    onError: vi.fn(),
    onStart: vi.fn(),
    onStop: vi.fn(),
    onEnd: vi.fn(),
  };
  eng.setCallbacks(cb);
  return { eng, cb };
}

describe('NativeSpeechEngine', () => {
  it('is supported only inside a native shell', () => {
    expect(new NativeSpeechEngine().supported).toBe(true);
    delete (window as any).Capacitor;
    expect(new NativeSpeechEngine().supported).toBe(false);
  });

  it('load() rejects with speech-unavailable when the recognizer is absent', async () => {
    fake.plugin.available = async () => ({ available: false });
    const { eng } = makeEngine();
    await expect(eng.load()).rejects.toThrow('speech-unavailable');
  });

  it('streams partial results via onInterim', async () => {
    const { eng, cb } = makeEngine();
    await eng.load();
    await eng.start();
    fake.listeners.partialResults[0]({ matches: ['hello'] });
    expect(cb.onInterim).toHaveBeenCalledWith('hello');
  });

  it('commits exactly one final on a stopped event, then onEnd', async () => {
    const { eng, cb } = makeEngine();
    await eng.load();
    await eng.start();
    fake.listeners.partialResults[0]({ matches: ['hello world'] });
    fake.listeners.listeningState[0]({ status: 'stopped' });
    expect(cb.onResult).toHaveBeenCalledTimes(1);
    expect(cb.onResult).toHaveBeenCalledWith('hello world', true, 0);
    expect(cb.onEnd).toHaveBeenCalledTimes(1);
  });

  it('is idempotent: a late stopped event after stop() commits only once', async () => {
    const { eng, cb } = makeEngine();
    await eng.load();
    await eng.start();
    fake.listeners.partialResults[0]({ matches: ['hi'] });
    eng.stop();
    fake.listeners.listeningState[0]({ status: 'stopped' });
    expect(cb.onResult).toHaveBeenCalledTimes(1);
    expect(cb.onEnd).toHaveBeenCalledTimes(1);
  });

  it('removeAllListeners is called before each start', async () => {
    const { eng } = makeEngine();
    await eng.load();
    vi.mocked(fake.plugin.removeAllListeners).mockClear();
    await eng.start();
    await eng.start();
    expect(fake.plugin.removeAllListeners).toHaveBeenCalledTimes(2);
  });
});
