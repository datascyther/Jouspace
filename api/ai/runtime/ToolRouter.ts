/**
 * Jouspace — AI Runtime: Tool Router
 *
 * Generic: given an Intent, ask the ToolRegistry for the tools behind each
 * capability and run them (in parallel). The router knows capabilities, not
 * provider names. Providers are registered into the registry at bootstrap
 * (dependency injection), so adding Exa/Tavily/PubMed later is a register()
 * call, not a router change.
 */

import { Capability, type Intent, type ToolResult, type FeatureFlags } from './types';
import { ToolRegistry, type Tool, type ToolInput } from './tools/Tool';
import { isCapabilityEnabled } from './config';

export class ToolRouter {
  constructor(
    private registry: ToolRegistry,
    private flags: FeatureFlags,
  ) {}

  /** Resolve the ordered list of tools to run for an intent. */
  resolve(intent: Intent): Tool[] {
    const tools: Tool[] = [];
    for (const cap of intent.capabilities) {
      if (!isCapabilityEnabled(cap, this.flags)) continue;
      for (const t of this.registry.get(cap)) {
        tools.push(t);
      }
    }
    // Always allow Memory/Profile/Journey context even if only GENERAL.
    if (intent.capabilities.includes(Capability.GENERAL)) {
      for (const t of this.registry.get(Capability.MEMORY)) tools.push(t);
    }
    return tools;
  }

  async run(intent: Intent, input: ToolInput): Promise<ToolResult[]> {
    const tools = this.resolve(intent);
    const results = await Promise.all(
      tools.map((t) =>
        t.run(input).catch(
          (e): ToolResult => ({
            capability: t.capability,
            success: false,
            confidence: 0,
            timestamp: new Date().toISOString(),
            sources: [],
            payload: '',
            error: e instanceof Error ? e.message : String(e),
          }),
        ),
      ),
    );
    return results;
  }
}
