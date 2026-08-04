/**
 * Jouspace — AI Runtime: Memory Tool (capability MEMORY/PROFILE/JOURNEY)
 *
 * No network call. Surfaces the user-state context forwarded by the client
 * (mood, goals, streak, journey, preferences) into a structured ToolResult
 * the ContextBuilder merges into the prompt. Keeps personalization server-side.
 */

import type { Tool, ToolInput } from './Tool';
import { Capability, type ToolResult } from '../types';

export class MemoryTool implements Tool {
  readonly capability = Capability.MEMORY;
  readonly name = 'MemoryTool';

  constructor(private cache?: unknown) {}

  async run(input: ToolInput): Promise<ToolResult> {
    const ctx = input.memoryContext;
    if (!ctx) {
      return this.empty();
    }

    const lines: string[] = ['USER STATE:'];
    if (ctx.userName) lines.push(`Name: ${ctx.userName}`);
    if (ctx.previousMood) lines.push(`Recent mood: ${ctx.previousMood}`);
    if (ctx.reflectionStreak && ctx.reflectionStreak > 1)
      lines.push(`Reflection streak: ${ctx.reflectionStreak} days`);
    if (ctx.currentJourney) lines.push(`Current journey focus: ${ctx.currentJourney}`);
    if (ctx.goals && ctx.goals.length) lines.push(`Goals: ${ctx.goals.join(', ')}`);
    if (ctx.preferences && ctx.preferences.length)
      lines.push(`Techniques that resonated: ${ctx.preferences.join(', ')}`);
    if (ctx.summary) lines.push(`Conversation summary: ${ctx.summary}`);
    if (ctx.recentTopics && ctx.recentTopics.length)
      lines.push(`Recent topics: ${ctx.recentTopics.join(', ')}`);

    return {
      capability: this.capability,
      success: lines.length > 1,
      confidence: 1,
      timestamp: new Date().toISOString(),
      sources: [],
      payload: lines.join('\n'),
    };
  }

  private empty(): ToolResult {
    return {
      capability: this.capability,
      success: false,
      confidence: 0,
      timestamp: new Date().toISOString(),
      sources: [],
      payload: '',
    };
  }
}
