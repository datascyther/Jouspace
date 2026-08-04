import { describe, it, expect } from 'vitest';
import { journeyRepository } from '../repositories/JourneyRepository';
import { RepositoryError } from '../repositories/baseRepository';

/**
 * S0.9 — Offline behavior.
 *
 * Supabase JS has NO offline write-queue / sync buffer: when the network is
 * unavailable, requests fail immediately (or via the client fetch timeout) —
 * they do NOT hang or silently queue. We cannot truly cut the network from a
 * Node test runner without OS-level firewalling, so the pure-offline case is
 * marked `it.skip` with a note. We DO assert the realistic analogue — an
 * operation with no auth/session context fails fast (throws `RepositoryError`)
 * rather than hanging.
 */
describe('Offline behavior', () => {
  it.skip('true offline simulation (network cut) — not simulated in Node runner', () => {
    // Intentionally skipped: dropping the network here would require OS-level
    // firewall rules. The Supabase client has no offline queue, so any real
    // offline request errors out / times out instead of queuing. Documented.
  });

  it('fails fast (throws) with no session, rather than hanging', async () => {
    const start = Date.now();
    await expect(journeyRepository.list()).rejects.toBeInstanceOf(RepositoryError);
    // Must resolve/reject quickly — well under any network timeout.
    expect(Date.now() - start).toBeLessThan(15000);
  });
});
