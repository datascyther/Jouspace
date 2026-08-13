/**
 * sse.ts — Server-Sent Events writer backed by a Web ReadableStream.
 * (Replaces server/stream/StreamController.ts, which used Express res.write.)
 *
 * Wire format (unchanged so the APK parser keeps working):
 *   data: {"text":"token"}\n\n
 *   data: [DONE]\n\n
 *   data: {"error":"..."}\n\n
 */

import type { GatewayStreamChunk } from '../../server/types.js';

const SSE_HEADERS: Record<string, string> = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
};

/** Build a streaming Response that pipes a gateway stream to the client as SSE. */
export function streamToResponse(
  source: AsyncIterable<GatewayStreamChunk>,
  request: Request,
  extraHeaders: Record<string, string> = {}
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const upstream = new AbortController();
      // Abort the upstream NVIDIA call if the client disconnects.
      request.signal.addEventListener('abort', () => upstream.abort());

      // Heartbeat keeps proxies from buffering across a long silent "thinking" gap.
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keep-alive\n\n'));
        } catch {
          /* stream already closed */
        }
      }, 15_000);

      // Hard ceiling: release the upstream even if NVIDIA truly stalls.
      const ceiling = setTimeout(() => upstream.abort(), 9 * 60 * 1000);

      try {
        for await (const chunk of source) {
          if (request.signal.aborted) break;
          if (chunk.done) {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            break;
          }
          if (chunk.text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.text })}\n\n`));
          }
        }
        if (!request.signal.aborted) {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        }
      } catch (err) {
        console.error('[sse] stream error:', err);
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Intelligence stream interrupted. Please try again.' })}\n\n`)
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch {
          /* closed */
        }
      } finally {
        clearInterval(keepAlive);
        clearTimeout(ceiling);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  const headers = { ...SSE_HEADERS, ...extraHeaders };
  return new Response(stream, { headers });
}
