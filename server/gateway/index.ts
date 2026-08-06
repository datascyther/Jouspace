/**
 * Gateway Factory
 *
 * Returns the active ModelGateway implementation based on the
 * GATEWAY_PROVIDER environment variable.
 *
 * To add a new provider:
 *   1. Create server/gateway/YourGateway.ts implementing ModelGateway
 *   2. Add a case below
 *   3. Set GATEWAY_PROVIDER=yourprovider in .env
 *   Nothing else in the runtime changes.
 */

import type { ModelGateway } from './ModelGateway.js';
import { NvidiaGateway } from './NvidiaGateway.js';

export type GatewayProvider = 'nvidia' | 'openai' | 'anthropic';

export function createModelGateway(): ModelGateway {
  const provider = (process.env.GATEWAY_PROVIDER ?? 'nvidia') as GatewayProvider;

  switch (provider) {
    case 'nvidia':
      return new NvidiaGateway();

    case 'openai':
      // TODO: Implement OpenAIGateway when ready
      // import { OpenAIGateway } from './OpenAIGateway.js';
      // return new OpenAIGateway();
      throw new Error('OpenAI gateway not yet implemented. Set GATEWAY_PROVIDER=nvidia.');

    case 'anthropic':
      // TODO: Implement AnthropicGateway when ready
      // import { AnthropicGateway } from './AnthropicGateway.js';
      // return new AnthropicGateway();
      throw new Error('Anthropic gateway not yet implemented. Set GATEWAY_PROVIDER=nvidia.');

    default:
      throw new Error(
        `Unknown GATEWAY_PROVIDER: "${provider}". Supported values: nvidia, openai, anthropic`
      );
  }
}

export type { ModelGateway, GatewayStreamChunk, ModelMessage } from './ModelGateway.js';
