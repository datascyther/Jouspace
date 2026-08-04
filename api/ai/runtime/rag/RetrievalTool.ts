/**
 * Jouspace — AI Runtime: RAG Retrieval interface (Phase 4.1)
 *
 * Defines the contract for internal knowledge retrieval (CBT guides,
 * meditation, journal/mood logs, journey lessons, clinical references).
 * The canonical implementation (PineconeRetrievalTool) sits behind a
 * VectorStore so the runtime never depends on a specific vector DB.
 * NotImplementedRetrievalTool returns [] so the orchestrator compiles and runs
 * with RAG disabled (default) and zero external dependencies.
 */

import { Capability, type Citation } from '../types';

export interface ContextChunk {
  content: string;
  source: string;
  confidence: number;
  citation?: Citation;
}

export interface RetrievalTool {
  readonly capability: Capability;
  retrieve(query: string): Promise<ContextChunk[]>;
}

export class NotImplementedRetrievalTool implements RetrievalTool {
  readonly capability = Capability.RAG;
  async retrieve(_query: string): Promise<ContextChunk[]> {
    return [];
  }
}
