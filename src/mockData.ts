import { Entry } from './components/EntryRow';

export interface UserProfile {
  name: string;
  initials: string;
  lastWroteDaysAgo: number;
}

export interface ContinueJournalPrompt {
  id: string;
  topicSummaryLines: [string, string, string];
}

export interface AIInsight {
  id: string;
  insightText: string;
  actionText: string;
}

// Default production mock data matching the reference image 100%
export const DEFAULT_USER: UserProfile = {
  name: 'VU',
  initials: 'VU',
  lastWroteDaysAgo: 4,
};

export const DEFAULT_CONTINUE_PROMPT: ContinueJournalPrompt = {
  id: 'prompt-1',
  topicSummaryLines: [
    'You were writing about discipline,',
    'pressure,',
    'and starting again.',
  ],
};

export const DEFAULT_AI_INSIGHT: AIInsight = {
  id: 'insight-1',
  insightText: 'You often return to consistency when you write after a gap.',
  actionText: 'Reflect with AI →',
};

export const DEFAULT_RECENT_ENTRIES: Entry[] = [
  {
    id: 'entry-1',
    date: 'Aug 1',
    title: 'I need to rebuild my rhythm',
    theme: 'discipline',
    content: 'Focusing on the quiet routine rather than high pressure targets...',
  },
  {
    id: 'entry-2',
    date: 'Jul 29',
    title: 'Why this app matters to me',
    theme: 'purpose',
    content: 'A space that doesn’t push streaks or check-ins, just quiet space for thought.',
  },
  {
    id: 'entry-3',
    date: 'Jul 26',
    title: 'Pressure, clarity, and focus',
    theme: 'clarity',
    content: 'Unpacking the noise from the week and returning to core priorities.',
  },
];
