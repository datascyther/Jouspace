export const config = {
    runtime: 'edge',
};

type Role = 'user' | 'assistant' | 'system';

type ChatHistoryMessage = {
    role: Exclude<Role, 'system'>;
    content: string;
};

type ChatRequest = {
    text: string;
    conversationId?: string;
    sessionId?: string;
    uid?: string;
    history?: ChatHistoryMessage[];
    mode?: 'concise' | 'standard' | 'deep';
    memoryContext?: Record<string, unknown>;
    requestId?: string;
};

function jsonResponse(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

function getUidFromRequest(request: Request, body: ChatRequest): string | null {
    const uidHeader = request.headers.get('x-uid');
    if (uidHeader && uidHeader.trim().length > 0) return uidHeader.trim();
    const uidBody = body?.uid;
    if (uidBody && typeof uidBody === 'string' && uidBody.trim().length > 0) return uidBody.trim();
    return null;
}

// Lazily construct the orchestrator once per edge instance (reused across invocations).
let orchestratorPromise: Promise<import('./runtime/AIOrchestrator').AIOrchestrator> | null = null;
function getOrchestrator() {
    if (!orchestratorPromise) {
        orchestratorPromise = Promise.resolve().then(async () => {
            const { createOrchestrator } = await import('./runtime/bootstrap');
            return createOrchestrator();
        });
    }
    return orchestratorPromise;
}

export default async function handler(request: Request) {
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-uid',
            },
        });
    }

    if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    let body: ChatRequest;
    try {
        body = (await request.json()) as ChatRequest;
    } catch {
        return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (!text) return jsonResponse({ error: 'Missing text' }, 400);

    const uid = getUidFromRequest(request, body);
    if (!uid) {
        return jsonResponse({ error: 'Missing uid. Provide x-uid header.' }, 401);
    }

    const history = Array.isArray(body.history) ? body.history : [];
    const validModes = ['concise', 'standard', 'deep'] as const;
    const mode: 'concise' | 'standard' | 'deep' = validModes.includes(body.mode as any) ? (body.mode as any) : 'standard';

    let orchestrator: Awaited<ReturnType<typeof getOrchestrator>>;
    try {
      orchestrator = await getOrchestrator();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      return jsonResponse(
        { error: 'AI service is unavailable.', detail: msg },
        503,
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            try {
                for await (const chunk of orchestrator.handle({
                    text,
                    conversationId: body.conversationId,
                    sessionId: body.sessionId,
                    uid,
                    history,
                    mode,
                    memoryContext: body.memoryContext as any,
                    requestId: body.requestId,
                })) {
                    controller.enqueue(encoder.encode(JSON.stringify(chunk) + '\n'));
                    if (chunk.done) break;
                }
                controller.close();
            } catch (e) {
                const msg = e instanceof Error ? e.message : 'Unknown error';
                controller.enqueue(
                    encoder.encode(JSON.stringify({ id: crypto.randomUUID(), contentDelta: '', done: true, error: msg }) + '\n'),
                );
                controller.close();
            }
        },
    });

    return new Response(stream, {
        status: 200,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
        },
    });
}
