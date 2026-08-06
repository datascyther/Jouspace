/**
 * ModelGateway — Provider Abstraction Interface
 *
 * This is the single boundary between the Jouspace Intelligence Runtime
 * and any underlying model provider. Every capability (chat, reflect,
 * insight, summarize) speaks to this interface only.
 *
 * Swapping providers means replacing the concrete implementation returned
 * by createModelGateway(). Nothing else in the runtime changes.
 */

import type { ModelMessage, GatewayStreamChunk } from '../types.js';

export interface ModelGateway {
  /**
   * Stream a completion from the model.
   *
   * Yields GatewayStreamChunk objects as tokens arrive.
   * The final chunk always has done: true.
   *
   * Reasoning / chain-of-thought tokens MUST be consumed and discarded
   * by the implementation — they must never appear in yielded chunks.
   *
   * @param messages  Full conversation history including system prompt
   */
  streamCompletion(messages: ModelMessage[]): AsyncIterable<GatewayStreamChunk>;
}

// Re-export types so consumers only need to import from gateway/
export type { ModelMessage, GatewayStreamChunk };
