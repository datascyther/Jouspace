import { describe, it, expect } from 'vitest';
import { truncateStream, MAX_MEMORY_CHARS } from '../stream/truncate.js';
import type { GatewayStreamChunk } from '../gateway/ModelGateway.js';

async function* fromChunks(chunks: GatewayStreamChunk[]): AsyncGenerator<GatewayStreamChunk> {
  for (const c of chunks) yield c;
}

async function collect(source: AsyncIterable<GatewayStreamChunk>): Promise<string> {
  let text = '';
  for await (const c of source) {
    if (c.done) break;
    text += c.text;
  }
  return text;
}

describe('truncateStream', () => {
  it('passes short streams through unchanged', async () => {
    const out = await collect(
      truncateStream(
        fromChunks([
          { text: 'hello ', done: false },
          { text: 'world', done: false },
          { text: '', done: true },
        ]),
        MAX_MEMORY_CHARS
      )
    );
    expect(out).toBe('hello world');
  });

  it('truncates output longer than the cap', async () => {
    const big = 'a'.repeat(MAX_MEMORY_CHARS + 500);
    const out = await collect(
      truncateStream(fromChunks([{ text: big, done: false }, { text: '', done: true }]), MAX_MEMORY_CHARS)
    );
    expect(out.length).toBe(MAX_MEMORY_CHARS);
    expect(out).toBe('a'.repeat(MAX_MEMORY_CHARS));
  });

  it('truncates mid-chunk and still ends cleanly', async () => {
    const out = await collect(
      truncateStream(
        fromChunks([
          { text: 'x'.repeat(400), done: false },
          { text: 'y'.repeat(400), done: false },
        ]),
        500
      )
    );
    expect(out.length).toBe(500);
  });
});
