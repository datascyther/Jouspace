/**
 * Jouspace — AI Runtime: Embedding Service (Phase 4.1)
 *
 * Produces dense vectors for RAG from NVIDIA's embedding models, keeping the
 * runtime's embedding provider consistent with its LLM provider. Server-only
 * (uses NVIDIA_API_KEY / VITE_NVIDIA_BASE_URL). If no key/base is configured,
 * embed() returns null so ingestion is a no-op rather than a crash.
 */

export interface EmbeddingOptions {
  model?: string;
  inputType?: 'query' | 'passage';
}

export class EmbeddingService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(opts: { apiKey?: string; baseUrl?: string; model?: string } = {}) {
    this.apiKey = opts.apiKey ?? process.env.NVIDIA_API_KEY ?? '';
    this.baseUrl = (opts.baseUrl ?? process.env.VITE_NVIDIA_BASE_URL ?? '').replace(/\/$/, '');
    // nv-embedqa-e5-v5 is NVIDIA's general-purpose embedding model; tune if needed.
    this.model = opts.model ?? process.env.NVIDIA_EMBED_MODEL ?? 'nvidia/nv-embedqa-e5-v5';
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0 && this.baseUrl.length > 0;
  }

  /** Embed a single string. Returns null when unconfigured. */
  async embed(text: string, opts: EmbeddingOptions = {}): Promise<number[] | null> {
    if (!this.isConfigured()) return null;
    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: opts.model ?? this.model,
        input: text,
        input_type: opts.inputType ?? 'passage',
        encoding_format: 'float',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const vec: number[] | undefined = data?.data?.[0]?.embedding ?? data?.embeddings?.[0];
    return Array.isArray(vec) ? vec : null;
  }

  /** Embed many strings in one call. Skips nulls. */
  async embedBatch(texts: string[], opts: EmbeddingOptions = {}): Promise<(number[] | null)[]> {
    if (!this.isConfigured()) return texts.map(() => null);
    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: opts.model ?? this.model,
        input: texts,
        input_type: opts.inputType ?? 'passage',
        encoding_format: 'float',
      }),
    });
    if (!res.ok) return texts.map(() => null);
    const data = await res.json().catch(() => null);
    const vecs: number[][] = data?.data?.map((d: any) => d.embedding) ?? data?.embeddings ?? [];
    return texts.map((_, i) => (Array.isArray(vecs[i]) ? vecs[i] : null));
  }
}
