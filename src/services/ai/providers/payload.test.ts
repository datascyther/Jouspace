import { describe, it, expect } from 'vitest';
import { buildNvidiaPayload } from './payload';

const MODEL = 'nvidia/nemotron-3-ultra-550b-a55b';
const MESSAGES = [{ role: 'user', content: 'hello' }];

describe('buildNvidiaPayload — mode-aware sampling', () => {
  it('uses standard sampling + thinking in standard mode', () => {
    const payload = JSON.parse(buildNvidiaPayload({ model: MODEL, messages: MESSAGES, stream: false, mode: 'standard' }));
    expect(payload.temperature).toBe(0.6);
    expect(payload.max_tokens).toBe(4096);
    expect(payload.reasoning_budget).toBe(4096);
    expect(payload.chat_template_kwargs).toEqual({ enable_thinking: true });
  });

  it('uses deeper sampling + larger budget in deep mode', () => {
    const payload = JSON.parse(buildNvidiaPayload({ model: MODEL, messages: MESSAGES, stream: false, mode: 'deep' }));
    expect(payload.temperature).toBe(0.5);
    expect(payload.max_tokens).toBe(16384);
    expect(payload.reasoning_budget).toBe(16384);
    expect(payload.chat_template_kwargs).toEqual({ enable_thinking: true });
  });

  it('defaults to standard mode when no mode supplied', () => {
    const payload = JSON.parse(buildNvidiaPayload({ model: MODEL, messages: MESSAGES, stream: true }));
    expect(payload.reasoning_budget).toBe(4096);
  });

  it('passes through the requested model and stream flag', () => {
    const payload = JSON.parse(buildNvidiaPayload({ model: MODEL, messages: MESSAGES, stream: true, mode: 'deep' }));
    expect(payload.model).toBe(MODEL);
    expect(payload.stream).toBe(true);
  });
});
