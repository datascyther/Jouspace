/**
 * personalization.ts — On-device "AI that saves itself".
 *
 * The runtime is stateless, so per-user personality lives on the device and is
 * sent as a `profile` payload on every AI request. This module:
 *  - Owns a versioned `jouspace:personalization` store (the distilled memory
 *    notes plus bookkeeping for the debounce/trigger logic).
 *  - Derives a cheap structural layer (top themes, entry count) from the local
 *    journal so the profile has substance even before distillation.
 *  - Distills a compact `memoryNotes` string via the /api/ai/memory capability,
 *    throttled (≥3 new entries OR ≥24h) and failure-safe: a failed distillation
 *    never wipes existing notes.
 *  - Builds the `profile` payload attached to every request, and the anonymous
 *    client ID (`X-User-Id`) used for server-side rate limiting.
 *
 * Local-first trust: nothing leaves the device except to the (user-configured)
 * runtime over HTTPS, and the user can view/reset it from Profile.
 */

import { journalStore } from '../store';
import { loadProfile, DEFAULT_DISPLAY_NAME } from '../hooks/useProfile';
import { streamOneShot, loadChatMessages } from '../hooks/useJouspaceIntelligence';

const PERSONALIZATION_KEY = 'jouspace:personalization';
const ANON_ID_KEY = 'jouspace:anonId';
const SCHEMA_VERSION = 1;

const DIGEST_MIN_NEW_ENTRIES = 3;
const DIGEST_MIN_INTERVAL_MS = 24 * 60 * 60 * 1000;
const MAX_PERSONALIZATION_CHARS = 2000;
const MAX_MEMORY_NOTES_CHARS = 600;

const DEFAULT_PERSONALIZATION: PersonalizationStore = {
  schemaVersion: SCHEMA_VERSION,
  memoryNotes: '',
  lastDigestAt: null,
  lastEntryCount: 0,
};

export interface PersonalizationStore {
  schemaVersion: number;
  /** Distilled, device-derived profile notes (≤ ~600 chars). */
  memoryNotes: string;
  /** Epoch ms of the last successful distillation (null = never). */
  lastDigestAt: number | null;
  /** Entry count at last distillation, used to detect "new entries". */
  lastEntryCount: number;
}

export interface AIProfile {
  userName?: string;
  topThemes?: string[];
  personalization?: string;
}

// ── Anonymous client identity (X-User-Id) ─────────────────────────────────────

/** Stable per-install opaque ID for anonymous rate limiting. Spoofable by
 *  design until accounts land; the global concurrency ceiling is the backstop. */
export function getAnonId(): string {
  let id = '';
  try {
    id = localStorage.getItem(ANON_ID_KEY) ?? '';
  } catch {
    /* private mode / storage disabled */
  }
  if (!id) {
    try {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(ANON_ID_KEY, id);
    } catch {
      id = 'anonymous';
    }
  }
  return id;
}

// ── Personalization store ──────────────────────────────────────────────────────

export function loadPersonalization(): PersonalizationStore {
  try {
    const raw = localStorage.getItem(PERSONALIZATION_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<PersonalizationStore>;
      return {
        schemaVersion: SCHEMA_VERSION,
        memoryNotes: typeof p.memoryNotes === 'string' ? p.memoryNotes : '',
        lastDigestAt: typeof p.lastDigestAt === 'number' ? p.lastDigestAt : null,
        lastEntryCount: typeof p.lastEntryCount === 'number' ? p.lastEntryCount : 0,
      };
    }
  } catch {
    /* corrupt payload → fall back to defaults */
  }
  return { ...DEFAULT_PERSONALIZATION };
}

function savePersonalization(p: PersonalizationStore): void {
  try {
    localStorage.setItem(PERSONALIZATION_KEY, JSON.stringify(p));
    // Notify cloudSync that personalization changed locally.
    window.dispatchEvent(new CustomEvent('jouspace:personalization:local-changed'));
  } catch {
    /* storage failure — non-fatal */
  }
}

/** Local-first trust: wipe the AI's memory. The next distillation rebuilds it. */
export function resetPersonalization(): void {
  try {
    localStorage.removeItem(PERSONALIZATION_KEY);
    // Notify cloudSync that personalization was reset.
    window.dispatchEvent(new CustomEvent('jouspace:personalization:local-changed'));
  } catch {
    /* non-fatal */
  }
}

// ── Cheap structural layer (no model call) ────────────────────────────────────

/** Top themes by frequency across the local journal (most common first). */
export function deriveTopThemes(max = 5): string[] {
  const counts = new Map<string, number>();
  for (const e of journalStore.list()) {
    const theme = (e.theme ?? '').trim().toLowerCase();
    if (!theme) continue;
    counts.set(theme, (counts.get(theme) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([t]) => t);
}

// ── Profile payload builder ───────────────────────────────────────────────────

/** Build the `profile` object sent with every AI request. Pure + synchronous. */
export function getAIProfilePayload(): AIProfile {
  const profile = loadProfile();
  const stored = loadPersonalization();
  const payload: AIProfile = {};

  const name = profile.displayName?.trim();
  if (name && name !== DEFAULT_DISPLAY_NAME) {
    payload.userName = name.slice(0, 80);
  }

  const themes = deriveTopThemes();
  if (themes.length > 0) payload.topThemes = themes;

  const notes = stored.memoryNotes.trim();
  if (notes) {
    payload.personalization = notes.slice(0, MAX_PERSONALIZATION_CHARS);
  }

  return payload;
}

// ── Distillation trigger + call ───────────────────────────────────────────────

/** Whether enough has changed to warrant a (cost-bounded) re-distillation. */
export function shouldDistill(entryCount: number): boolean {
  const p = loadPersonalization();
  if (entryCount === 0) return false;
  const newEntries = entryCount - p.lastEntryCount;
  if (newEntries >= DIGEST_MIN_NEW_ENTRIES) return true;
  if (p.lastDigestAt === null) return entryCount >= 1;
  if (Date.now() - p.lastDigestAt >= DIGEST_MIN_INTERVAL_MS) return true;
  return false;
}

/**
 * Distill a fresh `memoryNotes` from the user's journal + their own recent chat
 * turns (never assistant text, to avoid self-reinforcing drift). Streams from
 * /api/ai/memory. On ANY failure, the previous notes are preserved — the AI's
 * memory must never silently go blank.
 */
export async function distillMemory(): Promise<string | null> {
  const stored = loadPersonalization();
  const entries = journalStore
    .list()
    .slice(0, 20)
    .map((e) => ({ id: e.id, date: e.date, title: e.title, theme: e.theme, content: e.content }));

  // The user's OWN recent chat turns only — not assistant replies.
  const userMessages = loadChatMessages()
    .filter((m) => m.role === 'user')
    .slice(-10)
    .map((m) => m.text);

  let notes = '';
  try {
    for await (const chunk of streamOneShot('memory', { entries, userMessages })) {
      notes += chunk;
    }
  } catch {
    return null; // keep previous notes
  }

  notes = notes.trim().slice(0, MAX_MEMORY_NOTES_CHARS);
  if (!notes) return null;

  savePersonalization({
    ...stored,
    memoryNotes: notes,
    lastDigestAt: Date.now(),
    lastEntryCount: entries.length,
  });
  return notes;
}
