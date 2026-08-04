import type { ChatMode } from '../types';

export interface NvidiaPayloadOptions {
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream: boolean;
  mode?: ChatMode;
}

/**
 * Builds the NVIDIA chat-completions request body.
 *
 * Nemotron 3 Ultra supports `chat_template_kwargs.enable_thinking` and
 * `reasoning_budget`, which unlock the model's peak reasoning depth. The
 * "deep" mode (user's Deep Reflection toggle / crisis escalation) trades
 * latency for richer, longer, more grounded responses.
 */
export function buildNvidiaPayload({
  model,
  messages,
  stream,
  mode = 'standard',
}: NvidiaPayloadOptions): string {
  const isDeep = mode === 'deep';
  return JSON.stringify({
    model,
    messages,
    temperature: isDeep ? 0.5 : 0.6,
    top_p: 0.95,
    max_tokens: isDeep ? 16384 : 4096,
    reasoning_budget: isDeep ? 16384 : 4096,
    chat_template_kwargs: { enable_thinking: true },
    stream,
  });
}
