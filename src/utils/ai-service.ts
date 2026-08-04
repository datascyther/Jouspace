import { env } from '@/core/config/env';

export class AIError extends Error {
    public statusCode?: number;
    public details?: unknown;

    constructor(message: string, statusCode?: number, details?: unknown) {
        super(message);
        this.name = 'AIError';
        this.statusCode = statusCode;
        this.details = details;
    }
}

export type AIMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

export type AIResponse = {
    content: string;
    reasoning?: string;
};

type StreamChunk = {
    id: string;
    contentDelta: string;
    done?: boolean;
};

export async function* streamAIChat(params: {
    text: string;
    uid: string;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    signal?: AbortSignal;
}): AsyncGenerator<StreamChunk> {
    const apiBase = env.apiBaseUrl;
    const url = apiBase.endsWith('/') ? `${apiBase}ai/chat` : `${apiBase}/ai/chat`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-uid': params.uid,
        },
        body: JSON.stringify({
            text: params.text,
            history: params.history,
        }),
        signal: params.signal,
    });

    if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => '');
        throw new AIError('AI request failed', res.status, errText);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            try {
                const parsed = JSON.parse(trimmed) as StreamChunk;
                yield parsed;
                if (parsed.done) return;
            } catch {
                // Ignore malformed lines.
            }
        }
    }

    if (buffer.trim()) {
        try {
            const parsed = JSON.parse(buffer.trim()) as StreamChunk;
            yield parsed;
        } catch {
            // ignore
        }
    }
}

export async function generateResponse(params: {
    text: string;
    uid: string;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}): Promise<AIResponse> {
    let content = '';
    for await (const chunk of streamAIChat(params)) {
        content += chunk.contentDelta;
    }
    return { content };
}
