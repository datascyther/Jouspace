export type PerfPhase =
  | 'send'
  | 'request_start'
  | 'first_chunk'
  | 'first_token'
  | 'complete';

export class PerfTracker {
  private marks = new Map<PerfPhase, number>();
  readonly id: string;

  constructor(id?: string) {
    this.id =
      id || `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  }

  mark(phase: PerfPhase) {
    if (!this.marks.has(phase)) {
      this.marks.set(phase, Date.now());
    }
  }

  report(): Record<string, number | string> {
    const t = (p: PerfPhase) => this.marks.get(p);
    const send = t('send');
    const requestStart = t('request_start');
    const firstToken = t('first_token');
    const complete = t('complete');

    const result: Record<string, number | string> = {};
    if (send) result.send = send;
    if (send && requestStart) result.to_request = requestStart - send;
    if (requestStart && firstToken) result.to_first_token = firstToken - requestStart;
    if (send && complete) result.total = complete - send;

    const parts = Object.entries(result)
      .filter(([k]) => k !== 'send')
      .map(([k, v]) => `${k}:${v}ms`);
    console.log(`[Perf] ${this.id} ${parts.join(' | ')}`);

    return result;
  }
}
