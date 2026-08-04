/**
 * Jouspace — AI Runtime Smoke Harness (Gate 1)
 *
 * Dependency-free Node ESM helper. POSTs a scenario to the runtime edge handler
 * and parses the NDJSON stream, recording latency + stream-integrity metrics.
 *
 * Exits are not performed here; callers (scripts/ai-runtime-smoke.mjs) own the
 * pass/fail policy and process exit code.
 */

/**
 * @typedef {Object} Scenario
 * @property {string} name
 * @property {string} text
 * @property {Array<{role:'user'|'assistant',content:string}>} [history]
 * @property {'standard'|'deep'} [mode]
 * @property {Record<string, unknown>} [memoryContext]
 * @property {string} [uid]
 * @property {string[]} [expectCapabilities]  capabilities the classifier should pick
 * @property {boolean} [expectCitations]       whether ≥1 citation is expected
 */

/**
 * @typedef {Object} Metrics
 * @property {string} name
 * @property {number} firstTokenMs   ms POST→first contentDelta
 * @property {number} totalMs        ms POST→terminal done/error chunk
 * @property {boolean} streamClosedCleanly  saw a terminal done chunk
 * @property {boolean} citationsPresent
 * @property {string[]} capabilities derived from the echoed requestId trace (if available)
 * @property {string} requestId
 * @property {string} error          terminal error message if any
 * @property {string} content        full accumulated content
 */

/**
 * @param {{baseUrl:string, scenario:Scenario, requestId?:string}} args
 * @returns {Promise<Metrics>}
 */
export async function runScenario({ baseUrl, scenario, requestId }) {
  const reqId = requestId ?? crypto.randomUUID();
  const uid = scenario.uid ?? `guest-${crypto.randomUUID()}`;
  // Hard ceiling so a hung upstream fails fast instead of hanging the run.
  const SCENARIO_TIMEOUT_MS = Number(process.env.SMOKE_SCENARIO_TIMEOUT_MS || 90000);

  const body = {
    text: scenario.text,
    history: scenario.history ?? [],
    mode: scenario.mode ?? 'standard',
    memoryContext: scenario.memoryContext ?? {},
    uid,
    requestId: reqId,
  };

  const start = Date.now();
  let firstTokenMs = -1;
  let totalMs = -1;
  let streamClosedCleanly = false;
  let citationsPresent = false;
  let echoedRequestId = '';
  let error = '';
  let content = '';
  const capabilities = [];
  const toolsUsed = [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SCENARIO_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-uid': uid,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timeout);
    totalMs = Date.now() - start;
    return {
      name: scenario.name,
      firstTokenMs: -1,
      totalMs,
      streamClosedCleanly: false,
      citationsPresent: false,
      capabilities,
      toolsUsed,
      requestId: reqId,
      error: `request aborted/timed out after ${SCENARIO_TIMEOUT_MS}ms: ${e.message}`,
      content: '',
    };
  }

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '');
    totalMs = Date.now() - start;
    return {
      name: scenario.name,
      firstTokenMs: -1,
      totalMs,
      streamClosedCleanly: false,
      citationsPresent: false,
      capabilities,
      requestId: reqId,
      error: `HTTP ${res.status}: ${text}`,
      content: '',
    };
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
      let chunk;
      try {
        chunk = JSON.parse(trimmed);
      } catch {
        continue;
      }
      if (chunk.requestId && !echoedRequestId) echoedRequestId = chunk.requestId;
      // Capabilities/toolsUsed ride on the FIRST chunk (plan §1.2/§1.6).
      if (Array.isArray(chunk.capabilities) && capabilities.length === 0) {
        capabilities.push(...chunk.capabilities);
      }
      if (Array.isArray(chunk.toolsUsed) && toolsUsed.length === 0) {
        toolsUsed.push(...chunk.toolsUsed);
      }
      if (typeof chunk.contentDelta === 'string' && chunk.contentDelta.length > 0) {
        if (firstTokenMs < 0) firstTokenMs = Date.now() - start;
        content += chunk.contentDelta;
      }
      if (Array.isArray(chunk.citations) && chunk.citations.length > 0) {
        citationsPresent = true;
      }
      if (chunk.done) {
        streamClosedCleanly = true;
        if (typeof chunk.error === 'string' && chunk.error.length > 0) error = chunk.error;
        totalMs = Date.now() - start;
      }
    }
  }

  clearTimeout(timeout);
  if (totalMs < 0) totalMs = Date.now() - start;

  return {
    name: scenario.name,
    firstTokenMs,
    totalMs,
    streamClosedCleanly,
    citationsPresent,
    capabilities,
    toolsUsed,
    requestId: echoedRequestId || reqId,
    error,
    content,
  };
}

export function pct(values, p = 95) {
  if (values.length === 0) return 0;
  const sorted = [...values].filter((v) => v >= 0).sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

export function avg(values) {
  const v = values.filter((x) => x >= 0);
  if (v.length === 0) return 0;
  return v.reduce((a, b) => a + b, 0) / v.length;
}
