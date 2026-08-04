/**
 * Reflection feature — barrel export.
 */

export { journalRepository } from '@/repositories/JournalRepository';
export { reflectionService } from './services/ReflectionService';
export type {
  JournalHubData,
  JournalReflection,
  JournalMeta,
  JournalTimeline,
  TimelineMoment,
  TimelineDay,
  TimelineMonth,
  TimelineKind,
} from './services/ReflectionService';
export { readJournalMeta } from './services/ReflectionService';
export {
  useJournalHub,
  JOURNAL_HUB_QUERY_KEY,
} from './hooks/useJournalHub';
export {
  useJournalReflection,
  JOURNAL_REFLECTION_QUERY_KEY,
} from './hooks/useJournalReflection';
export {
  useJournalTimeline,
  JOURNAL_TIMELINE_QUERY_KEY,
} from './hooks/useJournalTimeline';
export {
  useMemoryLibrary,
  JOURNAL_MEMORY_QUERY_KEY,
} from './hooks/useMemoryLibrary';
export {
  useWeeklyReview,
  JOURNAL_WEEKLY_QUERY_KEY,
} from './hooks/useWeeklyReview';
export type { WeeklyReview } from './services/ReflectionService';
export {
  loadMemories,
  saveMemories,
  addMemory,
  removeMemory,
} from './persistence/memoryStorage';
export type { MemoryItem } from './persistence/memoryStorage';
export { useSaveJournal } from './hooks/useSaveJournal';
export {
  loadDraft,
  saveDraft,
  clearDraft,
} from './persistence/draftStorage';
export type { JournalDraft } from './persistence/draftStorage';
