/**
 * truncateStream.ts — Cap a streamed AI passage to a maximum character count.
 *
 * Used by the /api/ai/memory route to guarantee the distilled personalization
 * profile never exceeds the bound the client expects (≤ ~600 chars). The model
 * is prompted to stay short, but the cap is enforced server-side so the contract
 * holds regardless of model behavior. Yields a clean `done: true` once the limit
 * is reached. Pure + testable.
 */

import type { GatewayStreamChunk } from '../gateway/ModelGateway.js';

export const MAX_MEMORY_CHARS = 600;

export async function* truncateStream(
  source: AsyncIterable<GatewayStreamChunk>,
  maxChars: number
): AsyncGenerator<GatewayStreamChunk> {
  let total = 0;
  for await (const chunk of source) {
    if (chunk.done) {
      yield chunk;
      return;
    }
    const remaining = maxChars - total;
    if (remaining <= 0) {
      yield { text: '', done: true };
      return;
    }
    if (chunk.text.length <= remaining) {
      total += chunk.text.length;
      yield chunk;
    } else {
      total = maxChars;
      yield { text: chunk.text.slice(0, remaining), done: false };
      yield { text: '', done: true };
      return;
    }
  }
}
