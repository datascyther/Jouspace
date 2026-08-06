# Jouspace Intelligence Runtime

A provider-agnostic AI orchestration layer that powers all intelligence features in Jouspace. The frontend communicates with `/api/ai/*` endpoints only. API keys, provider identity, and model details are confined to this process.

---

## Architecture

```
Frontend
  ├── AIScreenContent    → useJouspaceIntelligence('chat')    → POST /api/ai/chat
  ├── AIReflectDrawer    → useJouspaceIntelligence('reflect')  → POST /api/ai/reflect
  └── future surfaces    → useJouspaceIntelligence(capability) → POST /api/ai/<capability>

Runtime (this server)
  ├── CapabilityRouter   routes each /api/ai/* to its capability handler
  ├── ContextAssembler   retrieves user's journal entries, themes, and name
  ├── PromptAssembler    builds capability-specific Jouspace-branded system prompts
  ├── ModelGateway       [interface] provider abstraction — only the gateway sees the API key
  │     └── NvidiaGateway  concrete implementation for NVIDIA NIM
  └── StreamController   writes AsyncIterable<GatewayStreamChunk> to SSE response
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3001` | HTTP port the server listens on |
| `GATEWAY_PROVIDER` | No | `nvidia` | Active model provider: `nvidia`, `openai`, `anthropic` |
| `NVIDIA_API_KEY` | Yes (if nvidia) | — | NVIDIA NIM API key |
| `OPENAI_API_KEY` | Yes (if openai) | — | OpenAI API key (gateway not yet implemented) |
| `ANTHROPIC_API_KEY` | Yes (if anthropic) | — | Anthropic API key (gateway not yet implemented) |
| `CORS_ORIGINS` | No | `''` | Extra comma-separated origins allowed by CORS (e.g. your deployed app's origin). Dev/`capacitor://localhost`/`https://localhost` are always allowed. |

Create a `.env` file in the **project root** (not in `server/`). It is gitignored.

---

## Running

```bash
# From the project root:
npm run dev:all        # Start Vite frontend + Intelligence Runtime simultaneously
npm run server         # Start the runtime only

# From server/:
npm run dev            # tsx watch — hot-reload on file changes
```

---

## Adding a New ModelGateway

1. Create `server/gateway/YourGateway.ts`:
   ```ts
   import type { ModelGateway, ModelMessage, GatewayStreamChunk } from './ModelGateway.js';

   export class YourGateway implements ModelGateway {
     async *streamCompletion(messages: ModelMessage[]): AsyncIterable<GatewayStreamChunk> {
       // Call your provider, silently discard any chain-of-thought tokens
       // Yield: { text: string, done: false } for each content token
       // Yield: { text: '', done: true } as the final chunk
     }
   }
   ```

2. Add a `case` in `server/gateway/index.ts`:
   ```ts
   case 'yourprovider':
     return new YourGateway();
   ```

3. Set `GATEWAY_PROVIDER=yourprovider` in `.env`.

Nothing else in the runtime changes.

---

## Adding a New Capability

Capabilities are the named intelligence features that the runtime exposes.

1. Add the route file `server/routes/yourCapability.ts`:
   ```ts
   import { Router } from 'express';
   import { assembleContext } from '../context/ContextAssembler.js';
   import { buildSystemPrompt, buildMessages } from '../prompt/PromptAssembler.js';
   import { createModelGateway } from '../gateway/index.js';
   import { initSSE, streamToClient } from '../stream/StreamController.js';

   export const yourCapabilityRouter = Router();

   yourCapabilityRouter.post('/yourCapability', async (req, res, next) => {
     try {
       const context = await assembleContext('user-1', 'yourCapability');
       const systemPrompt = buildSystemPrompt(context, 'yourCapability');
       const messages = buildMessages(systemPrompt, req.body.messages);
       const gateway = createModelGateway();
       initSSE(res);
       await streamToClient(req, res, gateway.streamCompletion(messages));
     } catch (err) { next(err); }
   });
   ```

2. Add the prompt variant in `server/prompt/PromptAssembler.ts` under `buildSystemPrompt()`.

3. Register the router in `server/index.ts`:
   ```ts
   import { yourCapabilityRouter } from './routes/yourCapability.js';
   app.use('/api/ai', yourCapabilityRouter);
   ```

4. Add the capability to `useJouspaceIntelligence`'s `Capability` type in the frontend hook.

---

## Capabilities

| Endpoint | Status | Description |
|---|---|---|
| `POST /api/ai/chat` | ✅ Live | Conversational journal intelligence |
| `POST /api/ai/reflect` | ✅ Live | Focused reflection on a specific insight |
| `POST /api/ai/insight` | ✅ Live | Auto-generate AI insight cards from entries |
| `POST /api/ai/summarize` | ✅ Live | Summarize an entry or memory thread |

All four capabilities stream their response as SSE. Validation, prompt
assembly, and the provider gateway are shared across them.

---

## Security Notes

- The API key is loaded from `.env` via `dotenv` at server startup. It is never serialised into any response.
- The global error handler in `server/index.ts` catches all unhandled errors and returns `{ error: "Intelligence unavailable" }` — stack traces never reach the client.
- Route validation (Zod) rejects malformed requests at the boundary. The `system` role is blocked from client-submitted messages; the runtime injects the system prompt internally.
- `reasoning_content` (model chain-of-thought) is consumed and discarded in `NvidiaGateway` — it never appears in SSE output.
