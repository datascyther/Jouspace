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
import type { ReasoningProfile } from '../reasoning.js';

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
   * @param opts.reasoning  Adaptive reasoning depth; the gateway maps this to
   *                        provider-specific params. Defaults to 'balanced'.
   * @param opts.signal     Optional AbortSignal to cancel the upstream request
   *                        when the client disconnects.
   */
  streamCompletion(
    messages: ModelMessage[],
    opts?: { reasoning?: ReasoningProfile; signal?: AbortSignal }
  ): AsyncIterable<GatewayStreamChunk>;

  /**
   * Transcribe a short audio clip (mono 16-bit PCM WAV) into text via the
   * provider's speech-recognition model. Used by the voice chat route so the
   * recorded clip becomes a regular user message before the model answers.
   *
   * @param audio  Raw WAV bytes (16-bit PCM, mono).
   * @throws       When transcription fails or yields no text.
   */
  transcribeAudio(audio: Buffer): Promise<string>;
}

// Re-export types so consumers only need to import from gateway/
export type { ModelMessage, GatewayStreamChunk };
