import { Entry } from './components/EntryRow';

/**
 * Bundled sample entries, used ONLY by Profile → "Load sample data"
 * (see `loadDemoData()` in src/store/index.ts). The app never seeds these
 * automatically — a fresh install starts with an empty journal.
 */
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
    content: "A space that doesn't push streaks or check-ins, just quiet space for thought.",
  },
  {
    id: 'entry-3',
    date: 'Jul 26',
    title: 'Pressure, clarity, and focus',
    theme: 'clarity',
    content: 'Unpacking the noise from the week and returning to core priorities.',
  },
];
