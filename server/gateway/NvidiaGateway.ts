/**
 * NvidiaGateway — ModelGateway implementation for NVIDIA NIM (hosted)
 *
 * Uses the OpenAI-compatible NVIDIA hosted API at integrate.api.nvidia.com.
 * Model: nvidia/nemotron-3-ultra-550b-a55b
 *
 * Key behaviours:
 * - API key is read from process.env.NVIDIA_API_KEY — never forwarded to clients
 * - reasoning_effort: "high" enables full chain-of-thought reasoning on the model side
 * - reasoning_content chunks (chain-of-thought) are silently consumed and discarded
 * - Only content chunks are yielded to the runtime
 * - The final chunk has done: true
 */

import OpenAI from 'openai';
import type { ModelGateway, ModelMessage, GatewayStreamChunk } from './ModelGateway.js';

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b';

export class NvidiaGateway implements ModelGateway {
  private readonly client: OpenAI;

  constructor() {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      throw new Error(
        'NVIDIA_API_KEY is not set. Add it to your .env file in the project root.'
      );
    }
    this.client = new OpenAI({
      baseURL: NVIDIA_BASE_URL,
      apiKey,
    });
  }

  async *streamCompletion(
    messages: ModelMessage[]
  ): AsyncIterable<GatewayStreamChunk> {
    // reasoning_effort and reasoning_budget are provider-specific top-level
    // params on integrate.api.nvidia.com, so they are not part of the base
    // OpenAI ChatCompletion types. We intersect the streaming params type with
    // the provider fields — the base properties remain fully checked while the
    // NVIDIA-only keys are permitted. The runtime request body is unchanged.
    const stream = await this.client.chat.completions.create({
      model: NVIDIA_MODEL,
      messages,
      temperature: 1,
      top_p: 0.95,
      max_tokens: 16384,
      stream: true,
      reasoning_effort: 'high',
      reasoning_budget: 16384,
    } as OpenAI.Chat.ChatCompletionCreateParamsStreaming & {
      reasoning_effort?: 'high' | 'medium' | 'low';
      reasoning_budget?: number;
    });

    for await (const chunk of stream) {
      if (!chunk.choices || chunk.choices.length === 0) continue;

      const delta = chunk.choices[0].delta as OpenAI.ChatCompletionChunk.Choice.Delta & {
        reasoning_content?: string;
      };

      // Silently consume reasoning_content — chain-of-thought must never
      // reach the frontend. The model's internal reasoning improves answer
      // quality but is not surfaced in the Jouspace UI.
      if (delta.reasoning_content) {
        continue; // consumed, not yielded
      }

      // Yield only the visible content tokens
      if (delta.content) {
        yield { text: delta.content, done: false };
      }
    }

    // Signal stream completion
    yield { text: '', done: true };
  }
}
