/**
 * Jouspace — Memory Types
 *
 * Defines the full context model for the AI conversation engine.
 * Every response is grounded in these data structures.
 */

export interface SessionMemory {
  conversationId: string;
  turnCount: number;
  summary: string | null;
  summaryTurnCount: number;
  recentTopics: string[];
  recentMood: string | null;
}

export interface UserContext {
  name: string | null;
  tone: 'warm' | 'motivational' | 'soothing' | 'auto';
  goals: string[];
  initialMood: string | null;
  returningUser: boolean;
}

/**
 * Phase 4 — Full Context Engine
 *
 * Injected before every AI response to ground the model in the user's
 * current state, history, and long-term preferences.
 */
export interface AIContext {
  /** User's display name */
  userName?: string;
  /** Preferred communication tone */
  preferredTone?: string;
  /** Time of day segment */
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  /** Whether the user has conversed before */
  returningUser?: boolean;
  /** Mood detected from the last interaction */
  previousMood?: string;
  /** Recent conversation summary (auto-generated every N turns) */
  summary?: string;
  /** User's wellness goals */
  goals?: string[];
  /** Current reflection streak (consecutive days) */
  reflectionStreak?: number;
  /** Active wellness journey focus area */
  currentJourney?: string;
  /** Long-term preferences (topics, techniques that resonate) */
  preferences?: string[];
  /** Last few topics discussed */
  recentTopics?: string[];
  /** Session count for context */
  sessionCount?: number;
}

export interface ContextEngineInput {
  userName?: string;
  preferredTone?: string;
  returningUser?: boolean;
  initialMood?: string;
  goals?: string[];
  reflectionStreak?: number;
  currentJourney?: string;
  preferences?: string[];
  sessionCount?: number;
}


