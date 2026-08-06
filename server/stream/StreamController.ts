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
  source: AsyncIterable<GatewayStreamChunk>
): Promise<void> {
  let clientDisconnected = false;

  req.on('close', () => {
    clientDisconnected = true;
  });

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
  }
}
