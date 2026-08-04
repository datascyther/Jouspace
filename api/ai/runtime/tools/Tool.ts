/**
 * Jouspace — AI Runtime: Tool Contract
 *
 * A Tool is capability-aware and returns ONLY structured data in the
 * standardized ToolResult envelope. Tools NEVER build prompts — that is the
 * sole responsibility of ContextBuilder. Providers are injected into tools
 * (dependency injection) so they remain swappable and unit-testable.
 */

import type { Capability, ToolResult, MemoryContext } from '../types';

export interface ToolInput {
  query: string;
  memoryContext?: MemoryContext;
  uid?: string;
  location?: { lat: number; lon: number };
}

export interface Tool {
  readonly capability: Capability;
  /** Human-readable name for traces. */
  readonly name: string;
  run(input: ToolInput): Promise<ToolResult>;
}

/**
 * ToolRegistry — capability → tool(s) mapping.
 *
 * Replaces provider-specific routing. The ToolRouter queries the registry,
 * so adding Exa/Tavily/PubMed later is a register() call, not a code change
 * in orchestration. A capability may have multiple providers (ordered
 * fallbacks); the router tries them in registration order.
 */
export class ToolRegistry {
  private registry = new Map<Capability, Tool[]>();

  register(tool: Tool, asCapability?: Capability): void {
    const key = asCapability ?? tool.capability;
    const list = this.registry.get(key) ?? [];
    list.push(tool);
    this.registry.set(key, list);
  }

  get(capability: Capability): Tool[] {
    return this.registry.get(capability) ?? [];
  }

  has(capability: Capability): boolean {
    return (this.registry.get(capability)?.length ?? 0) > 0;
  }

  /** Every registered tool (for diagnostics). */
  all(): Tool[] {
    return Array.from(this.registry.values()).flat();
  }
}
