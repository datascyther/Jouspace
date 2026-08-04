/**
 * ReflectionService — aggregates the Journal Hub view-model.
 *
 * Owns all Journal Hub derivation so the screen stays presentational:
 *
 *   JournalHubScreen → useJournalHub → ReflectionService.getHub(uid)
 *
 * Each section fetch is isolated via `safe()` so one failure never blanks the
 * rest of the Hub. The "AI Reflection" and "Memories" surfaces are DERIVED from
 * the user's own entries in Phase 1 — they degrade gracefully and never
 * replace the user's voice (see JOURNAL_FOUNDATION.md, Sprint 1.2).
 */

import { journalRepository } from '@/repositories/JournalRepository';
import { loadDraft } from '../persistence/draftStorage';
import { loadMemories } from '../persistence/memoryStorage';
import type { EmotionType } from '@/constants/emotions';
import { EMOTION_COLORS } from '@/constants/emotions';
import type { JournalRow } from '../../../../backend/services/JournalService';

/**
 * Reads the optional mood/tags metadata stashed in the `attachments` JSON
 * column. Kept inside `attachments` (not a schema column) so Phase-1 mood and
 * tags work without a backend migration; the frozen schema is untouched.
 */
export interface JournalMeta {
  mood?: EmotionType | null;
  tags?: string[];
}

export function readJournalMeta(attachments: unknown): JournalMeta {
  if (!attachments || typeof attachments !== 'object') return {};
  const obj = attachments as Record<string, unknown>;
  const mood = obj.mood as EmotionType | undefined;
  const tags = Array.isArray(obj.tags) ? (obj.tags as string[]) : undefined;
  return { mood: mood ?? null, tags: tags ?? [] };
}

/** Resolve a single failed fetch to a safe fallback without breaking the rest. */
async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (err) {
    console.error('[ReflectionService] isolated fetch failure:', err);
    return fallback;
  }
}

export function isToday(iso?: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).toDateString() === new Date().toDateString();
}

export function relativeDayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long' });
}

/** Day label for the Timeline: Today / Yesterday / weekday / "Jul 1". */
export function timelineDayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff > 1 && diff <= 7) return d.toLocaleDateString(undefined, { weekday: 'long' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function wordCount(text?: string | null): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const POSITIVE = [
  'hopeful', 'optimistic', 'happy', 'calm', 'grateful', 'better', 'good',
  'joy', 'relief', 'proud', 'excited', 'peaceful',
];
const NEGATIVE = [
  'anxious', 'stress', 'overwhelm', 'sad', 'tired', 'lonely', 'angry',
  'fear', 'worried', 'down', 'exhausted', 'lost',
];

/** Count positive / negative lexemes across a set of entries. */
export function scanSentiment(entries: JournalRow[]): { pos: number; neg: number } {
  const text = entries
    .map((e) => `${e.title ?? ''} ${e.body ?? ''}`)
    .join(' ')
    .toLowerCase();
  let pos = 0;
  let neg = 0;
  for (const w of POSITIVE) if (text.includes(w)) pos++;
  for (const w of NEGATIVE) if (text.includes(w)) neg++;
  return { pos, neg };
}

/**
 * Derives a gentle "noticing" sentence from recent entries. This is a Phase-1
 * stand-in for the AI Analysis pipeline (JOURNAL_TECHNICAL_ARCHITECTURE.md):
 * it only surfaces what the user already wrote, in the companion voice
 * ("I've noticed…"), never prescriptive advice.
 */
function deriveAiReflection(entries: JournalRow[]): string {
  if (entries.length === 0) {
    return "Your journal is a quiet place for your thoughts. Whenever you're ready, write one line.";
  }

  const recent = entries.slice(0, 5);

  const { pos, neg } = scanSentiment(recent);

  if (pos > neg && pos > 0) {
    return "I've noticed your recent entries carry a lighter tone. That shift is worth pausing on.";
  }
  if (neg > pos && neg > 0) {
    return "I've noticed some heavier themes in your writing lately. Be gentle with yourself.";
  }
  if (entries.length >= 3) {
    return `I've noticed you've returned to journaling ${entries.length} times recently. That consistency matters.`;
  }
  return "I've been reading along. Your words are safe here.";
}

export interface JournalHubData {
  entries: JournalRow[];
  reflectedToday: boolean;
  aiReflection: string;
  meaningfulMoments: number;
  memoryCount: number;
  draft: JournalDraftSummary | null;
}

export interface JournalDraftSummary {
  title: string;
  body: string;
  updatedAt: number;
}

export interface JournalReflection {
  noticing: string;
  pattern: string;
  observation: string;
  question: string;
}

/**
 * Derives the structured Reflection output (the R1 screen) from the user's own
 * entries. This is the Phase-1 stand-in for the AI Analysis pipeline
 * (JOURNAL_TECHNICAL_ARCHITECTURE.md): it only surfaces what the user already
 * wrote, in the companion voice. Deliberately NOT chat and NOT analysis — just
 * a Pattern, an Observation, and an open Question, so the user stays with their
 * own reflection.
 */
export function buildReflection(entries: JournalRow[]): JournalReflection {
  const recent = entries.slice(0, 8);
  const noticing = deriveAiReflection(recent);

  if (recent.length === 0) {
    return {
      noticing,
      pattern: 'You have not written yet. Your first entry is where reflection begins.',
      observation: 'There is nothing to notice yet — and that is okay.',
      question: 'What is one small thing on your mind right now?',
    };
  }

  const { pos, neg } = scanSentiment(recent);
  const totalWords = recent.reduce((sum, e) => sum + wordCount(e.body), 0);
  const moods = recent
    .map((e) => readJournalMeta(e.attachments).mood)
    .filter((m): m is EmotionType => !!m);

  // Pattern — the shape of the week.
  let pattern: string;
  if (recent.length >= 3) {
    pattern = 'You have returned to journaling several times recently — a steady rhythm is forming.';
  } else if (pos > neg) {
    pattern = 'A lighter tone has been showing up more often in your writing lately.';
  } else if (neg > pos) {
    pattern = 'Heavier themes have appeared more than once this week.';
  } else {
    pattern = 'Your writing has moved between lighter and heavier notes — a natural, human mix.';
  }

  // Observation — one specific thing noticed.
  let observation: string;
  if (moods.length > 0) {
    const counts: Record<string, number> = {};
    for (const m of moods) counts[m] = (counts[m] ?? 0) + 1;
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as EmotionType;
    observation = `Your “${EMOTION_COLORS[top].label}” moments are the ones you come back to most.`;
  } else if (totalWords >= 200) {
    observation = 'You tend to write more on the days that matter most to you.';
  } else {
    observation = 'Your most recent entry carried a thoughtful, steady pace.';
  }

  // Question — open, never prescriptive.
  let question: string;
  if (neg > pos) question = 'Would you like to explore what made those moments heavier?';
  else if (pos > neg) question = 'What helped those lighter moments feel the way they did?';
  else if (recent.length >= 3) question = 'Would you like to explore why this rhythm matters to you?';
  else question = 'Would you like to explore why this stood out to you?';

  return { noticing, pattern, observation, question };
}

class ReflectionService {
  async getHub(uid: string): Promise<JournalHubData> {
    const entries = await safe(journalRepository.loadEntries(uid), [] as JournalRow[]);

    const sorted = [...entries].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    const recent = sorted.slice(0, 12);

    const reflectedToday = recent.some((e) => isToday(e.created_at));
    const aiReflection = deriveAiReflection(recent);
    const meaningfulMoments = recent.filter((e) => wordCount(e.body) >= 50).length;
    const savedMemories = await safe(loadMemories(uid), [] as import('../persistence/memoryStorage').MemoryItem[]);
    const memoryCount = savedMemories.length;

    const draft = await safe(loadDraft(uid), null);
    const hasDraft =
      draft && (draft.title.trim().length > 0 || draft.body.trim().length > 0)
        ? { title: draft.title, body: draft.body, updatedAt: draft.updatedAt }
        : null;

    return {
      entries: recent,
      reflectedToday,
      aiReflection,
      meaningfulMoments,
      memoryCount,
      draft: hasDraft,
    };
  }

  async getReflection(uid: string): Promise<JournalReflection> {
    const entries = await safe(journalRepository.loadEntries(uid), [] as JournalRow[]);
    const sorted = [...entries].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return buildReflection(sorted);
  }

  async getTimeline(uid: string): Promise<JournalTimeline> {
    const entries = await safe(journalRepository.loadEntries(uid), [] as JournalRow[]);
    return buildTimeline(entries);
  }

  async getMemoryLibrary(uid: string): Promise<MemoryLibrary> {
    const [entries, memories] = await Promise.all([
      safe(journalRepository.loadEntries(uid), [] as JournalRow[]),
      loadMemories(uid),
    ]);
    const sorted = [...entries].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    const promotedIds = new Set(memories.map((m) => m.entryId).filter(Boolean) as string[]);
    const suggestions: MemorySuggestion[] = sorted
      .filter((e) => wordCount(e.body) >= 50 && !promotedIds.has(e.id))
      .slice(0, 6)
      .map((e) => ({
        entryId: e.id,
        title: suggestMemoryTitle(e),
        snippet: (e.body ?? '').trim().slice(0, 120),
      }));
    return { memories, suggestions };
  }

  async getWeeklyReview(uid: string): Promise<WeeklyReview> {
    const entries = await safe(journalRepository.loadEntries(uid), [] as JournalRow[]);
    return buildWeeklyReview(entries);
  }
}

export interface WeeklyReview {
  count: number;
  mostCommonMood?: EmotionType | null;
  mostCommonMoodLabel?: string;
  biggestLesson: string;
  meaningfulMemory?: { id: string; title: string } | null;
  reflection: string;
  toneA: string;
  toneB: string;
}

/** Sunday 00:00 of the week containing `d`. */
function startOfWeekSunday(d: Date): Date {
  const x = new Date(d);
  x.setDate(x.getDate() - x.getDay());
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Derives the Weekly Review (Sprint 2.7) from the current week's entries.
 * All derived locally in Phase 1: journal count, most common mood, biggest
 * lesson, the week's meaningful memory, the companion reflection, and two
 * short tone lines. "Every Sunday" is the intended cadence; the screen itself
 * is always available from the Hub.
 */
export function buildWeeklyReview(entries: JournalRow[]): WeeklyReview {
  const now = new Date();
  const start = startOfWeekSunday(now);
  const week = entries.filter((e) => {
    const t = new Date(e.created_at).getTime();
    return t >= start.getTime() && t <= now.getTime();
  });

  const count = week.length;
  const moods = week
    .map((e) => readJournalMeta(e.attachments).mood)
    .filter((m): m is EmotionType => !!m);
  let mostCommonMood: EmotionType | null = null;
  if (moods.length > 0) {
    const counts: Record<string, number> = {};
    for (const m of moods) counts[m] = (counts[m] ?? 0) + 1;
    mostCommonMood = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as EmotionType;
  }

  const meaningful = [...week]
    .filter((e) => wordCount(e.body) >= 50)
    .sort((a, b) => wordCount(b.body) - wordCount(a.body))[0];
  const meaningfulMemory = meaningful
    ? {
        id: meaningful.id,
        title: meaningful.title?.trim() || (meaningful.body ?? '').trim().split(/\s+/).slice(0, 6).join(' '),
      }
    : null;

  const { pos, neg } = scanSentiment(week);
  const totalWords = week.reduce((sum, e) => sum + wordCount(e.body), 0);

  let biggestLesson: string;
  if (count === 0) {
    biggestLesson = 'The week is still unwritten — your first line is the lesson.';
  } else if (meaningful) {
    biggestLesson = 'Your biggest lesson came from a moment you slowed down to write out fully.';
  } else if (pos > neg) {
    biggestLesson = 'A lighter tone kept returning this week — noticing it was the lesson.';
  } else if (neg > pos) {
    biggestLesson = 'Naming the heavier moments here was its own quiet lesson.';
  } else {
    biggestLesson = 'Even a few lines this week counted as a lesson in noticing.';
  }

  const reflection = deriveAiReflection(week);

  const toneA = mostCommonMood
    ? `Very ${EMOTION_COLORS[mostCommonMood].label.toLowerCase()}.`
    : pos > neg
      ? 'Hopeful.'
      : neg > pos
        ? 'Heavy.'
        : 'Steady.';
  const toneB = totalWords >= 300 ? 'Very editorial.' : totalWords >= 120 ? 'Considered.' : 'Sparing.';

  return {
    count,
    mostCommonMood,
    mostCommonMoodLabel: mostCommonMood ? EMOTION_COLORS[mostCommonMood].label : undefined,
    biggestLesson,
    meaningfulMemory,
    reflection,
    toneA,
    toneB,
  };
}

export interface MemorySuggestion {
  entryId: string;
  title: string;
  snippet: string;
}

export interface MemoryLibrary {
  memories: import('../persistence/memoryStorage').MemoryItem[];
  suggestions: MemorySuggestion[];
}

/** Derives a short, human title for a candidate memory from the entry itself. */
function suggestMemoryTitle(entry: JournalRow): string {
  if (entry.title?.trim()) return entry.title.trim();
  const words = (entry.body ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 5);
  const title = words.join(' ');
  return title ? title.replace(/[.!?]+$/, '') : 'Untitled moment';
}

export type TimelineKind = 'journal' | 'memory' | 'reflection';

export interface TimelineMoment {
  kind: TimelineKind;
  id: string;
  label: string;
  mood?: EmotionType | null;
  count?: number;
}

export interface TimelineDay {
  key: string;
  label: string;
  iso: string;
  moments: TimelineMoment[];
}

export interface TimelineMonth {
  key: string;
  label: string;
  days: TimelineDay[];
}

export interface JournalTimeline {
  months: TimelineMonth[];
}

/**
 * Builds the life-oriented Timeline (Sprint 2.4): grouped by month, then day,
 * surfacing the facets of a journaling life — ✍️ Journal, 🧠 AI Reflection,
 * ⭐ Memory — instead of a flat file list. All derived from the user's own
 * entries (Phase 1). The reflection moment is pinned to the most recent writing
 * day; memory moments mark substantial (>= 50 word) entries.
 */
export function buildTimeline(entries: JournalRow[]): JournalTimeline {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const byDay = new Map<string, JournalRow[]>();
  for (const e of sorted) {
    const key = new Date(e.created_at).toDateString();
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(e);
  }

  const days: TimelineDay[] = [];
  let isFirstDay = true;
  for (const [key, dayEntries] of byDay.entries()) {
    const mostRecent = dayEntries[0];
    const moments: TimelineMoment[] = [];
    moments.push({
      kind: 'journal',
      id: mostRecent.id,
      label: 'Journal',
      mood: readJournalMeta(mostRecent.attachments).mood,
      count: dayEntries.length,
    });
    const meaningful = dayEntries.find((e) => wordCount(e.body) >= 50);
    if (meaningful) {
      moments.push({ kind: 'memory', id: meaningful.id, label: 'Memory' });
    }
    if (isFirstDay) {
      moments.push({ kind: 'reflection', id: mostRecent.id, label: 'AI Reflection' });
    }
    isFirstDay = false;
    days.push({
      key,
      label: timelineDayLabel(mostRecent.created_at),
      iso: mostRecent.created_at,
      moments,
    });
  }

  const byMonth = new Map<string, TimelineMonth>();
  for (const d of days) {
    const dt = new Date(d.iso);
    const monthKey = `${dt.getFullYear()}-${dt.getMonth()}`;
    const monthLabel = dt.toLocaleDateString(undefined, { month: 'long' });
    if (!byMonth.has(monthKey)) {
      byMonth.set(monthKey, { key: monthKey, label: monthLabel, days: [] });
    }
    byMonth.get(monthKey)!.days.push(d);
  }

  return { months: Array.from(byMonth.values()) };
}

export const reflectionService = new ReflectionService();
export default reflectionService;
