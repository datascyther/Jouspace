/**
 * StreamController
 *
 * Writes a ModelGateway async stream to an HTTP response as
 * Server-Sent Events (SSE). This is the only place in the runtime
 * where the wire format is defined.
 *
 * SSE wire format:
 *   data: {"text":"token..."}\n\n   — incremental content chunk
 *   data: [DONE]\n\n               — stream complete signal
 *   data: {"error":"..."}\n\n      — error (never exposes provider details)
 *
 * The frontend reads these events and accumulates them into message state.
 */

import type { Response, Request } from 'express';
import type { GatewayStreamChunk } from '../gateway/ModelGateway.js';

/**
 * Set SSE headers on the response.
 * Must be called before any data is written.
 */
export function initSSE(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // Prevent nginx / reverse proxies from buffering the stream
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
}

/**
 * Write a single SSE token event.
 */
function writeToken(res: Response, text: string): void {
  res.write(`data: ${JSON.stringify({ text })}\n\n`);
}

/**
 * Write the SSE done sentinel.
 */
function writeDone(res: Response): void {
  res.write('data: [DONE]\n\n');
  res.end();
}

/**
 * Write an SSE error event and close the stream.
 * The message is intentionally generic — never expose provider details.
 */
function writeError(res: Response, message: string): void {
  res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
  res.write('data: [DONE]\n\n');
  res.end();
}

/**
 * Pipe an async iterable of GatewayStreamChunks to the HTTP response as SSE.
 *
 * Handles:
 * - Client disconnect: stops writing silently when request is aborted
 * - Done sentinel: writes [DONE] and closes the response
 * - Errors: writes a safe error event and closes cleanly
 */
export async function streamToClient(
  req: Request,
  res: Response,
  source: AsyncIterable<GatewayStreamChunk>,
  // Upstream abort controller owned by the route. Aborting it cancels the
  // in-flight NVIDIA call (frees the model, lets the ceiling work). It is NOT
  // req.signal — Express's req.signal is already aborted on arrival in this
  // runtime, which would abort every request instantly.
  upstreamAbort?: AbortController
): Promise<void> {
  let clientDisconnected = false;

  req.on('close', () => {
    clientDisconnected = true;
    upstreamAbort?.abort();
  });

  // ── Heartbeat ──────────────────────────────────────────────────────────────
  // Keep the browser + Vite proxy from dropping the SSE across a long silent
  // "thinking" gap. An SSE comment line (`: keep-alive`) is ignored by clients
  // and by our frontend parser (parseSSELine drops non-`data:` lines).
  const keepAlive = setInterval(() => {
    if (res.writableEnded) return;
    res.write(': keep-alive\n\n');
  }, 15_000);

  // ── Hard ceiling ───────────────────────────────────────────────────────────
  // No infinite hang if NVIDIA truly stalls. Abort the upstream call; the
  // generator throws, which the catch below turns into a clean close.
  const ceiling = setTimeout(() => {
    upstreamAbort?.abort();
  }, 9 * 60_000);

  try {
    for await (const chunk of source) {
      if (clientDisconnected) break;

      if (chunk.done) {
        writeDone(res);
        return;
      }

      if (chunk.text) {
        writeToken(res, chunk.text);
      }
    }

    // Ensure we always close cleanly even if the source ended without done:true
    if (!res.writableEnded) {
      writeDone(res);
    }
  } catch (err) {
    console.error('[StreamController] Error during stream:', err);
    if (!res.writableEnded) {
      writeError(res, 'Intelligence stream interrupted. Please try again.');
    }
  } finally {
    clearInterval(keepAlive);
    clearTimeout(ceiling);
  }
}
