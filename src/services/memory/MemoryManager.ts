/**
 * MemoryManager
 *
 * Phase 3/4 — Full Context Engine
 *
 * Tracks conversation state, builds rich AI context, and manages
 * summarization. Before every response, buildContext() injects the
 * user's current state, history, and long-term preferences.
 */

import { SessionMemory, UserContext, AIContext, ContextEngineInput } from './types';
import { getTimeOfDay, detectMood, detectCrisisSignals } from '@/prompts/mentalWellnessPrompt';
import type { ChatMode } from '@/services/ai/types';

export class MemoryManager {
  private session: SessionMemory;
  private user: UserContext;
  private preferences: string[] = [];
  private reflectionStreak: number = 0;
  private currentJourney: string | null = null;
  private sessionCount: number = 0;
  private crisisDetected = false;

  readonly DEFAULT_SUMMARY_TURNS = 8;

  constructor(conversationId: string, contextInput?: ContextEngineInput) {
    this.session = {
      conversationId,
      turnCount: 0,
      summary: null,
      summaryTurnCount: 0,
      recentTopics: [],
      recentMood: null,
    };

    this.user = {
      name: contextInput?.userName ?? null,
      tone: (contextInput?.preferredTone as UserContext['tone']) ?? 'auto',
      goals: contextInput?.goals ?? [],
      initialMood: contextInput?.initialMood ?? null,
      returningUser: contextInput?.returningUser ?? false,
    };

    this.preferences = contextInput?.preferences ?? [];
    this.reflectionStreak = contextInput?.reflectionStreak ?? 0;
    this.currentJourney = contextInput?.currentJourney ?? null;
    this.sessionCount = contextInput?.sessionCount ?? 0;
  }

  incrementTurn(): void {
    this.session.turnCount++;
  }

  addTopic(topic: string): void {
    if (!this.session.recentTopics.includes(topic)) {
      this.session.recentTopics.push(topic);
      if (this.session.recentTopics.length > 10) {
        this.session.recentTopics.shift();
      }
    }
  }

  setMood(mood: string): void {
    this.session.recentMood = mood;
  }

  /**
   * Records the user's detected mood from an inbound message and flags any
   * crisis-level content so the next response can escalate reasoning depth.
   */
  observeUserMessage(text: string): void {
    const mood = detectMood(text);
    if (mood !== 'neutral') {
      this.setMood(mood);
    }
    if (detectCrisisSignals(text)) {
      this.crisisDetected = true;
    }
  }

  /**
   * Adaptive depth: crisis escalates the model to its deepest reasoning mode
   * (safety first — the model reasons hardest when it matters most). Otherwise
   * the standard mode is used.
   */
  getRecommendedMode(): ChatMode {
    return this.crisisDetected ? 'deep' : 'standard';
  }

  setSummary(summary: string): void {
    this.session.summary = summary;
    this.session.summaryTurnCount = this.session.turnCount;
  }

  needsSummarization(): boolean {
    return this.session.turnCount - this.session.summaryTurnCount >= this.DEFAULT_SUMMARY_TURNS;
  }

  /**
   * Build the full AI context before every response.
   * This implements Phase 4 — Context Engine.
   *
   * Injects: user name, current mood, reflection streak, recent
   * conversation summary, current wellness journey, long-term preferences.
   */
  buildContext(): AIContext {
    return {
      userName: this.user.name ?? undefined,
      preferredTone: this.user.tone,
      timeOfDay: getTimeOfDay(),
      returningUser: this.user.returningUser || undefined,
      previousMood: this.session.recentMood ?? undefined,
      summary: this.session.summary ?? undefined,
      goals: this.user.goals.length > 0 ? this.user.goals : undefined,
      reflectionStreak: this.reflectionStreak > 0 ? this.reflectionStreak : undefined,
      currentJourney: this.currentJourney ?? undefined,
      preferences: this.preferences.length > 0 ? this.preferences : undefined,
      recentTopics: this.session.recentTopics.length > 0 ? this.session.recentTopics : undefined,
      sessionCount: this.sessionCount > 0 ? this.sessionCount : undefined,
    };
  }

  buildCondensedHistory(
    fullHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
    if (!this.session.summary) {
      return fullHistory;
    }

    const last6 = fullHistory.slice(-6);
    return [
      { role: 'system', content: `Previous conversation summary: ${this.session.summary}` },
      ...last6,
    ];
  }

  getSession(): Readonly<SessionMemory> {
    return { ...this.session };
  }

  /** Update context data mid-conversation (e.g., mood detected from message) */
  updateContext(data: Partial<ContextEngineInput>): void {
    if (data.userName) this.user.name = data.userName;
    if (data.preferredTone) this.user.tone = data.preferredTone as UserContext['tone'];
    if (data.goals) this.user.goals = data.goals;
    if (data.reflectionStreak !== undefined) this.reflectionStreak = data.reflectionStreak;
    if (data.currentJourney) this.currentJourney = data.currentJourney;
    if (data.preferences) this.preferences = data.preferences;
  }
}
