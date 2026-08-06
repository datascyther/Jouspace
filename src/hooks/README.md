# useJouspaceIntelligence

The single frontend interface to the Jouspace Intelligence Runtime.

All AI surfaces — chat, reflect, and future capabilities — use this hook. The frontend never imports from the server, sees an API key, or knows which model is running.

---

## API

```ts
import { useJouspaceIntelligence } from '@/hooks/useJouspaceIntelligence';

const ai = useJouspaceIntelligence(capability, initialMessages?);
```

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `capability` | `'chat' \| 'reflect'` | Which runtime capability to call |
| `initialMessages` | `IntelligenceMessage[]` | Optional seed messages (e.g. pre-loaded history) |

### Return value

| Field | Type | Description |
|---|---|---|
| `messages` | `IntelligenceMessage[]` | Full conversation including user + assistant turns |
| `isThinking` | `boolean` | True from `send()` until the first token arrives — drives the thinking dots indicator |
| `isStreaming` | `boolean` | True while tokens are actively arriving — drives the streaming cursor |
| `error` | `string \| null` | Non-null if the last request failed |
| `send(text, options?)` | `(string, SendOptions?) => void` | Send a message and start streaming |
| `abort()` | `() => void` | Cancel the in-flight stream |
| `reset()` | `() => void` | Clear all messages and abort any stream |

### State machine

```
idle
  → send() called
thinking  (isThinking: true, isStreaming: false)
  → first token received
streaming (isThinking: false, isStreaming: true)
  → [DONE] received
idle      (isThinking: false, isStreaming: false)
```

---

## Usage examples

### Chat capability

```tsx
const ai = useJouspaceIntelligence('chat');

// Send a message
ai.send("What am I circling around lately?");

// Map to existing UI states
const showThinking = ai.isThinking;
```

### Reflect capability

```tsx
const ai = useJouspaceIntelligence('reflect');

// Open a reflection anchored to an insight
ai.send('', { insight: 'You often return to clarity after a gap.' });

// Follow-up from the user
ai.send("I hadn't thought about it that way", {
  insight: 'You often return to clarity after a gap.'
});
```

---

## Adding a new capability

1. Add the new value to the `Capability` type:
   ```ts
   export type Capability = 'chat' | 'reflect' | 'yourCapability';
   ```

2. Add a case in `send()` to build the correct request body for the new capability.

3. Add the corresponding route to the server (see `server/README.md`).
