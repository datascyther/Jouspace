/**
 * Jouspace Intelligence Runtime — Shared Types
 *
 * These types are the internal contracts between all runtime layers.
 * The frontend never imports from here directly.
 */

// ── Journal domain ────────────────────────────────────────────────────────────

export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  theme: string;
  content: string;
}

// ── Context assembled for a capability request ────────────────────────────────

export interface JouspaceContext {
  userName: string;
  topThemes: string[];
  recentEntries: JournalEntry[];
  /** For reflection capability: the specific insight being reflected on */
  anchorInsight?: string;
  /** For reflection capability: the entry being reflected on */
  anchorEntry?: JournalEntry;
  /**
   * Device-derived personalization notes (treated as DATA, not instructions).
   * Injected into the system prompt inside a clearly-labeled block.
   */
  personalization?: string;
}

// ── Model-layer message (provider-agnostic) ───────────────────────────────────

export type MessageRole = 'system' | 'user' | 'assistant';

export interface ModelMessage {
  role: MessageRole;
  content: string;
}

// ── Capability types ──────────────────────────────────────────────────────────

export type Capability = 'chat' | 'reflect' | 'insight' | 'summarize' | 'memory';

// ── Gateway streaming chunk ───────────────────────────────────────────────────

export interface GatewayStreamChunk {
  /** Incremental content text token(s) */
  text: string;
  /** True on the final chunk — signals stream end */
  done: boolean;
}

// ── Personalization profile (client-supplied, device-derived) ──────────────────
// Sent on every AI request so the stateless runtime can feel personal without
// ever storing per-user state. `personalization` is treated as DATA, not
// instructions (see PromptAssembler), to limit indirect prompt-injection.

export interface ClientProfile {
  userName?: string;
  topThemes?: string[];
  personalization?: string;
}

// ── SSE event shape sent to the frontend ─────────────────────────────────────

export interface SSETokenEvent {
  text: string;
}

export interface SSEDoneEvent {
  done: true;
}

export interface SSEErrorEvent {
  error: string;
}
