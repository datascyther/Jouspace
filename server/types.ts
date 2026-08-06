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
}

// ── Model-layer message (provider-agnostic) ───────────────────────────────────

export type MessageRole = 'system' | 'user' | 'assistant';

export interface ModelMessage {
  role: MessageRole;
  content: string;
}

// ── Capability types ──────────────────────────────────────────────────────────

export type Capability = 'chat' | 'reflect' | 'insight' | 'summarize' | 'search';

// ── Gateway streaming chunk ───────────────────────────────────────────────────

export interface GatewayStreamChunk {
  /** Incremental content text token(s) */
  text: string;
  /** True on the final chunk — signals stream end */
  done: boolean;
}

// ── Capability request payloads (validated at route layer) ────────────────────

export interface ChatRequest {
  capability: 'chat';
  messages: ModelMessage[];
  context?: {
    entryId?: string;
  };
}

export interface ReflectRequest {
  capability: 'reflect';
  /** The AI insight text being reflected on */
  insight: string;
  /** Optional follow-up thought from the user */
  userThought?: string;
  /** Prior turns in this reflection session */
  history?: ModelMessage[];
}

export type CapabilityRequest = ChatRequest | ReflectRequest;

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
