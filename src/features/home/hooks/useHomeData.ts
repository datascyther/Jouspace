// src/features/home/hooks/useHomeData.ts
//
// Aggregates the minimal data the AI-native journal Home screen needs.
// Prefers real journal data when present; falls back to the returning-user
// target state so the Home screen never collapses into empty-state copy.

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { journalService } from '../../../../backend/services/JournalService';
import type { JournalRow } from '../../../../backend/services/JournalService';

export interface AIInsight {
  label: string;
  insight: string;
  actionLabel: string;
}

export interface RecentEntry {
  id: string;
  dateLabel: string;
  title: string;
  tag?: string;
}

/** Returning-user target demo rows (reference image). */
const TARGET_RECENT_ENTRIES: RecentEntry[] = [
  {
    id: 'demo-1',
    dateLabel: 'Aug 1',
    title: 'I need to rebuild my rhythm',
    tag: 'discipline',
  },
  {
    id: 'demo-2',
    dateLabel: 'Jul 29',
    title: 'Why this app matters to me',
    tag: 'purpose',
  },
  {
    id: 'demo-3',
    dateLabel: 'Jul 26',
    title: 'Pressure, clarity, and focus',
    tag: 'clarity',
  },
];

const TARGET_TOPIC = 'discipline, pressure, and starting again';
const TARGET_LAST_WROTE = 'Last wrote 4 days ago.';
const TARGET_GREETING = 'Good afternoon';

const TARGET_INSIGHT: AIInsight = {
  label: 'Jouspace noticed',
  insight: 'You often return to consistency when you write after a gap.',
  actionLabel: 'Reflect with AI →',
};

function getInitials(name: string | null | undefined): string {
  if (!name) return 'VU';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  return `${month} ${d.getDate()}`;
}

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function deriveTopic(body: string | null, title: string | null): string {
  const text = (title || body || '').toLowerCase();
  const themes: Array<{ words: string[]; label: string }> = [
    {
      words: ['discipline', 'pressure', 'start', 'again', 'rhythm'],
      label: 'discipline, pressure, and starting again',
    },
    { words: ['purpose', 'why', 'matter'], label: 'purpose and meaning' },
    { words: ['clarity', 'focus', 'clear'], label: 'clarity and focus' },
    { words: ['calm', 'peace', 'quiet'], label: 'calm and quiet' },
    { words: ['anxiety', 'stress', 'overwhelm'], label: 'anxiety and stress' },
    { words: ['gratitude', 'thankful', 'grateful'], label: 'gratitude' },
    { words: ['work', 'job', 'career'], label: 'work and career' },
    {
      words: ['relationship', 'friend', 'family', 'love'],
      label: 'relationships',
    },
  ];
  for (const t of themes) {
    if (t.words.some((w) => text.includes(w))) return t.label;
  }
  return TARGET_TOPIC;
}

function deriveTag(body: string | null, title: string | null): string | undefined {
  const text = (title || body || '').toLowerCase();
  const map: Array<{ words: string[]; tag: string }> = [
    { words: ['discipline', 'pressure', 'rhythm', 'start'], tag: 'discipline' },
    { words: ['purpose', 'why', 'matter'], tag: 'purpose' },
    { words: ['clarity', 'focus', 'clear'], tag: 'clarity' },
    { words: ['calm', 'peace', 'quiet'], tag: 'calm' },
    { words: ['anxiety', 'stress', 'overwhelm'], tag: 'stress' },
    { words: ['gratitude', 'thankful', 'grateful'], tag: 'gratitude' },
    { words: ['work', 'job', 'career'], tag: 'work' },
    { words: ['relationship', 'friend', 'family', 'love'], tag: 'love' },
  ];
  for (const m of map) {
    if (m.words.some((w) => text.includes(w))) return m.tag;
  }
  return undefined;
}

/**
 * Mocked AI insight loader. Always resolves to the returning-user target
 * insight so empty-state copy never appears on Home.
 */
function useMockInsight() {
  const query = useQuery({
    queryKey: ['homeAiInsight'],
    queryFn: () =>
      new Promise<AIInsight>((resolve) => {
        setTimeout(() => resolve(TARGET_INSIGHT), 700);
      }),
    staleTime: 60_000,
  });
  return { insight: query.data ?? null, isLoading: query.isLoading };
}

export interface HomeData {
  /** Fixed target greeting phrase, e.g. "Good afternoon". */
  greeting: string;
  displayName: string;
  initials: string;
  /** Always false for Home UI — returning-user target state. */
  isNewUser: boolean;
  lastWroteLabel: string;
  recentTopic: string;
  recentEntries: RecentEntry[];
  insight: AIInsight;
  isInsightLoading: boolean;
}

export function useHomeData(): HomeData {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const { data: journals = [] } = useQuery({
    queryKey: ['journals_list', uid],
    queryFn: () => journalService.list(),
    enabled: !!uid,
  });

  const sorted = useMemo(
    () =>
      [...journals].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [journals],
  );

  const { insight, isLoading: isInsightLoading } = useMockInsight();

  const displayName = 'VU';
  const initials = getInitials('VU');

  const lastWroteLabel = useMemo(() => {
    if (sorted.length === 0) return TARGET_LAST_WROTE;
    const last = sorted[0];
    const days = daysBetween(new Date(last.created_at), new Date());
    if (days <= 0) return 'Last wrote today.';
    if (days === 1) return 'Last wrote yesterday.';
    return `Last wrote ${days} days ago.`;
  }, [sorted]);

  const recentTopic = useMemo(() => {
    if (sorted.length === 0) return TARGET_TOPIC;
    const last = sorted[0];
    return deriveTopic(last.body, last.title);
  }, [sorted]);

  const recentEntries: RecentEntry[] = useMemo(() => {
    if (sorted.length === 0) return TARGET_RECENT_ENTRIES;
    return sorted.slice(0, 5).map((j: JournalRow) => ({
      id: j.id,
      dateLabel: formatDateLabel(j.created_at),
      title: (j.title || j.body || 'Untitled entry')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 48),
      tag: deriveTag(j.body, j.title),
    }));
  }, [sorted]);

  return {
    greeting: TARGET_GREETING,
    displayName,
    initials,
    isNewUser: false,
    lastWroteLabel,
    recentTopic,
    recentEntries,
    insight: insight ?? TARGET_INSIGHT,
    isInsightLoading,
  };
}
