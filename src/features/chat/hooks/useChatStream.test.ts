import { describe, it, expect } from 'vitest';
import { AIError } from '@/services/ai/types';
import type { Message } from '../types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function classifyError(error: unknown): string {
  if (error instanceof AIError) {
    if (error.statusCode === 401) {
      return 'Session expired. Please sign in again.';
    }
    if (error.statusCode === 500 || error.statusCode === 502) {
      const detail =
        error.details && typeof error.details === 'string'
          ? `: ${error.details.slice(0, 200)}`
          : '';
      return `Server error${detail}. Tap to retry.`;
    }
    if (error.statusCode === 408) {
      return 'Request timed out. Tap to retry.';
    }
    if (error.statusCode === 503) {
      const detail =
        error.details && typeof error.details === 'string'
          ? `: ${error.details.slice(0, 200)}`
          : '';
      return `Service temporarily busy${detail}. Tap to retry.`;
    }
    const statusInfo = error.statusCode ? ` (HTTP ${error.statusCode})` : '';
    return `AI request failed${statusInfo}. Tap to retry.`;
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes('network request failed') ||
      msg.includes('failed to fetch') ||
      msg.includes('networkerror')
    ) {
      return 'No internet connection. Check your network and tap to retry.';
    }
    if (msg.includes('abort') || msg.includes('signal')) {
      return 'Request was cancelled.';
    }
    if (msg.includes('timeout')) {
      return 'Request timed out. Tap to retry.';
    }
    return `${error.message}. Tap to retry.`;
  }

  return 'Something went wrong. Tap to retry.';
}

const MAX_HISTORY_MESSAGES = 40;

function buildHistory(
  messages: Message[],
): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
  const doneMessages = messages
    .filter((m) => m.status === 'complete' && (m.role === 'user' || m.role === 'assistant'))
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
  return doneMessages.slice(-MAX_HISTORY_MESSAGES);
}

describe('classifyError', () => {
  it('returns session expired message for 401', () => {
    const error = new AIError('Unauthorized', 401);
    expect(classifyError(error)).toBe('Session expired. Please sign in again.');
  });

  it('returns server error message for 500', () => {
    const error = new AIError('Internal error', 500);
    expect(classifyError(error)).toBe('Server error. Tap to retry.');
  });

it('returns server error message for 502', () => {
  const error = new AIError('Bad gateway', 502);
  expect(classifyError(error)).toBe('Server error. Tap to retry.');
});

it('returns service busy message for 503', () => {
  const error = new AIError('Worker limit reached', 503);
  expect(classifyError(error)).toBe('Service temporarily busy. Tap to retry.');
});

it('includes details for 503 when present', () => {
  const error = new AIError('Worker limit reached', 503, 'ResourceExhausted: Worker local total request limit reached (32/32)');
  expect(classifyError(error)).toBe('Service temporarily busy: ResourceExhausted: Worker local total request limit reached (32/32). Tap to retry.');
});

it('includes details for 500 when present', () => {
    const error = new AIError('Internal error', 500, 'Model overloaded');
    expect(classifyError(error)).toBe('Server error: Model overloaded. Tap to retry.');
  });

  it('returns timeout message for 408', () => {
    const error = new AIError('Timeout', 408);
    expect(classifyError(error)).toBe('Request timed out. Tap to retry.');
  });

  it('returns rate limit message for 429', () => {
    const error = new AIError('Too Many Requests', 429);
    expect(classifyError(error)).toBe('AI request failed (HTTP 429). Tap to retry.');
  });

  it('returns generic AI error for 400', () => {
    const error = new AIError('Bad Request', 400);
    expect(classifyError(error)).toBe('AI request failed (HTTP 400). Tap to retry.');
  });

  it('returns network error for network request failed', () => {
    const error = new Error('network request failed');
    expect(classifyError(error)).toBe('No internet connection. Check your network and tap to retry.');
  });

  it('returns network error for failed to fetch', () => {
    const error = new Error('Failed to fetch');
    expect(classifyError(error)).toBe('No internet connection. Check your network and tap to retry.');
  });

  it('returns network error for networkerror', () => {
    const error = new Error('NetworkError');
    expect(classifyError(error)).toBe('No internet connection. Check your network and tap to retry.');
  });

  it('returns cancelled for abort error', () => {
    const error = new Error('AbortError: The operation was aborted');
    expect(classifyError(error)).toBe('Request was cancelled.');
  });

  it('returns cancelled for signal error', () => {
    const error = new Error('signal is aborted');
    expect(classifyError(error)).toBe('Request was cancelled.');
  });

  it('returns timeout for timeout error', () => {
    const error = new Error('timeout of 30000ms exceeded');
    expect(classifyError(error)).toBe('Request timed out. Tap to retry.');
  });

  it('returns generic message for unknown error', () => {
    const error = new Error('Something weird happened');
    expect(classifyError(error)).toBe('Something weird happened. Tap to retry.');
  });

  it('returns fallback for non-Error unknown', () => {
    expect(classifyError('string error')).toBe('Something went wrong. Tap to retry.');
  });

  it('returns fallback for null', () => {
    expect(classifyError(null)).toBe('Something went wrong. Tap to retry.');
  });
});

describe('buildHistory', () => {
  const makeMsg = (id: string, role: 'user' | 'assistant', status: Message['status'], content: string): Message => ({
    id,
    role,
    type: 'markdown',
    content,
    createdAt: new Date(),
    status,
  });

  it('filters out streaming messages', () => {
    const msgs = [
      makeMsg('1', 'user', 'complete', 'Hello'),
      makeMsg('2', 'assistant', 'streaming', 'Hi'),
    ];
    const history = buildHistory(msgs);
    expect(history).toHaveLength(1);
    expect(history[0].role).toBe('user');
  });

  it('filters out failed messages', () => {
    const msgs = [
      makeMsg('1', 'user', 'complete', 'Hello'),
      makeMsg('2', 'assistant', 'failed', 'Error'),
    ];
    const history = buildHistory(msgs);
    expect(history).toHaveLength(1);
    expect(history[0].role).toBe('user');
  });

  it('only includes user and assistant roles', () => {
    const msgs = [
      makeMsg('1', 'user', 'complete', 'Hello'),
      makeMsg('2', 'assistant', 'complete', 'Hi there'),
    ];
    const history = buildHistory(msgs);
    expect(history).toHaveLength(2);
    expect(history[0].role).toBe('user');
    expect(history[1].role).toBe('assistant');
  });

  it('preserves order', () => {
    const msgs = [
      makeMsg('1', 'user', 'complete', 'First'),
      makeMsg('2', 'assistant', 'complete', 'Second'),
      makeMsg('3', 'user', 'complete', 'Third'),
    ];
    const history = buildHistory(msgs);
    expect(history.map((h) => h.content)).toEqual(['First', 'Second', 'Third']);
  });
});

describe('generateId', () => {
  it('returns a non-empty string', () => {
    const id = generateId();
    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
  });

  it('includes a timestamp component', () => {
    const before = Date.now();
    const id = generateId();
    const after = Date.now();
    const ts = parseInt(id.split('-')[0], 10);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it('generates unique IDs on successive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});
