/**
 * Jouspace — AI Runtime: Medical Tool (capability MEDICAL)
 *
 * Phase 3.x (production) will wire PubMed / WHO / NIH / NHS / CDC here. For
 * the vertical slice, trusted general knowledge via KnowledgeTool covers the
 * surface; this tool documents the intended capability boundary and returns a
 * clear, safe payload. No schema changes (backend freeze respected).
 */

import type { Tool, ToolInput } from './Tool';
import { Capability, type ToolResult } from '../types';
import type { CacheManager } from '../cache/CacheManager';
import { KnowledgeTool } from './KnowledgeTool';

export class MedicalTool implements Tool {
  readonly capability = Capability.MEDICAL;
  readonly name = 'MedicalTool';

  constructor(
    private cache: CacheManager,
    private knowledge = new KnowledgeTool(cache),
  ) {}

  async run(input: ToolInput): Promise<ToolResult> {
    const base = await this.knowledge.run(input);
    // Tag as medical so the ContextBuilder can append the non-diagnostic note.
    return {
      ...base,
      capability: Capability.MEDICAL,
      payload: base.payload
        ? `${base.payload}\n\nNOTE: Jouspace provides general wellness information only and does not diagnose or prescribe. Consult a licensed clinician for medical advice.`
        : '',
    };
  }
}
