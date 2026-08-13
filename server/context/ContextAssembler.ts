/**
 * ContextAssembler
 *
 * Retrieves and structures the user's journal context for a given capability.
 * This is the data layer of the Intelligence Runtime — the slot where a
 * future database query, vector search, or semantic retrieval goes.
 *
 * Right now it returns well-structured mock data that exactly matches the
 * data model used by the frontend. Replacing `fetchContext` with a real
 * DB call leaves every downstream layer unchanged.
 */

import type { JouspaceContext, JournalEntry, ClientProfile } from '../types.js';

// ── Seed data ─────────────────────────────────────────────────────────────────
// Mirrors DEFAULT_RECENT_ENTRIES and DEFAULT_PROFILE from src/mockData.ts.
// When a real data layer is added, this is replaced by DB queries.

const SEED_ENTRIES: JournalEntry[] = [
  {
    id: 'entry-1',
    date: 'Aug 1',
    title: 'I need to rebuild my rhythm',
    theme: 'discipline',
    content:
      'Focusing on the quiet routine rather than high pressure targets. ' +
      'There is something about returning after a break that feels both ' +
      'uncomfortable and necessary. The gap itself becomes the entry point.',
  },
  {
    id: 'entry-2',
    date: 'Jul 29',
    title: 'Why this app matters to me',
    theme: 'purpose',
    content:
      "A space that doesn't push streaks or check-ins, just quiet space for thought. " +
      'I want to build something that respects the pace of reflection. ' +
      'Not everything needs to be optimised.',
  },
  {
    id: 'entry-3',
    date: 'Jul 26',
    title: 'Pressure, clarity, and focus',
    theme: 'clarity',
    content:
      'Unpacking the noise from the week and returning to core priorities. ' +
      'What actually matters vs what just feels urgent. ' +
      'Clarity is usually found by removing, not adding.',
  },
  {
    id: 'entry-4',
    date: 'Jul 24',
    title: 'A quieter place to think',
    theme: 'clarity',
    content:
      'Sometimes the best thinking happens in silence, not in productivity systems. ' +
      'Writing is a way of slowing thought down enough to examine it.',
  },
  {
    id: 'entry-5',
    date: 'Jul 18',
    title: 'Small daily rituals',
    theme: 'discipline',
    content:
      'The compound effect of tiny consistent actions. Not motivation-driven bursts, ' +
      'but structural habits that run even when energy is low.',
  },
];

const SEED_USER = {
  userName: 'VU',
  topThemes: ['clarity', 'discipline', 'purpose'],
};

// ── Context assembly ──────────────────────────────────────────────────────────

export interface ContextOptions {
  /** Max entries to include in context (default: 5) */
  maxEntries?: number;
  /** Specific entry to anchor a reflect or summarize capability */
  anchorEntryId?: string;
  /** Insight text to anchor a reflection */
  anchorInsight?: string;
  /**
   * Entries supplied by the client (local-first device data). When present,
   * these replace the server-side seed — the AI reflects the user's real
   * journal. Falls back to SEED_ENTRIES when omitted or empty.
   */
  entries?: JournalEntry[];
  /**
   * Device-derived personalization profile sent by the client. When supplied,
   * it overrides the hardcoded seed user (name/topThemes) and carries the
   * distilled `personalization` notes for injection into the system prompt.
   */
  profile?: ClientProfile;
}

/**
 * Assemble context for a capability request.
 *
 * Local-first architecture: the device is the source of truth and sends its
 * journal entries with each request. The runtime stays stateless — a future
 * cloud-synced deployment can instead look entries up from a database scoped
 * to `_userId` and pass them the same way.
 *
 * @param _userId     Future: used to look up entries from a database
 * @param capability  Shapes which context fields are populated
 * @param options     Optional filters, anchors, and client-supplied entries
 */
export async function assembleContext(
  _userId: string,
  capability: string,
  options: ContextOptions = {}
): Promise<JouspaceContext> {
  const { maxEntries = 5, anchorEntryId, anchorInsight, entries, profile } = options;

  // Use the client's real entries when provided; otherwise fall back to seed.
  const source = entries && entries.length > 0 ? entries : SEED_ENTRIES;
  const recent = source.slice(0, maxEntries);

  // Local-first personalization: when the client supplies a profile, it
  // overrides the hardcoded seed identity. The runtime stays stateless — it
  // never stores this; it's replayed from the device on every request.
  const userName = profile?.userName?.trim() || SEED_USER.userName;
  const topThemes =
    profile?.topThemes && profile.topThemes.length > 0
      ? profile.topThemes
      : SEED_USER.topThemes;

  const context: JouspaceContext = {
    userName,
    topThemes,
    recentEntries: recent,
    personalization: profile?.personalization?.trim() || undefined,
  };

  // Reflection capability adds an anchor
  if (capability === 'reflect') {
    if (anchorInsight) {
      context.anchorInsight = anchorInsight;
    }
    if (anchorEntryId) {
      context.anchorEntry = source.find((e) => e.id === anchorEntryId);
    }
  }

  return context;
}
