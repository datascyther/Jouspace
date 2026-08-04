import type { AIResponse } from './ai-service';
import { AIError, generateResponse as generateResponseFromAiService, streamAIChat } from './ai-service';

/**
 * Lightweight client-facing AI abstraction only.
 * No browser-side model/provider execution; delegates to /api/ai/chat via ai-service.
 */
export type AIMessage = { role: 'user' | 'assistant' | 'system'; content: string };

export { AIError };

function toTextAndHistory(messages: AIMessage[]) {
  const last = messages[messages.length - 1];
  const text = last?.content ?? '';

  const history = messages
    .slice(0, -1)
    .filter((m): m is { role: 'user' | 'assistant'; content: string } => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));

  return { text, history };
}

export async function generateResponse(params: {
  uid: string;
  messages: AIMessage[];
}): Promise<AIResponse> {
  const { text, history } = toTextAndHistory(params.messages);
  return generateResponseFromAiService({ text, uid: params.uid, history });
}

export async function* streamResponse(params: {
  uid: string;
  messages: AIMessage[];
  signal?: AbortSignal;
}) {
  const { text, history } = toTextAndHistory(params.messages);

  for await (const chunk of streamAIChat({
    text,
    uid: params.uid,
    history,
    signal: params.signal,
  })) {
    yield chunk;
  }
}
