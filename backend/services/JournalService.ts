/**
 * JournalService — application boundary for `journal_entries`.
 *
 * Thin facade over JournalRepository. The ViewModel/UI must talk to this service
 * (never to the repository or Supabase directly), matching how `AuthService`
 * already works:
 *
 *    UI / ViewModel → JournalService → JournalRepository → Supabase
 */

import { journalRepository } from '../repositories/JournalRepository';
import type { JournalInput, JournalPatch } from '../repositories/JournalRepository';
import { RepositoryError } from '../repositories/baseRepository';
import type { Database } from '../database.types';

type JournalRow = Database['public']['Tables']['journal_entries']['Row'];

class JournalService {
  list(): Promise<JournalRow[]> {
    return journalRepository.list();
  }

  get(id: string): Promise<JournalRow | null> {
    return journalRepository.get(id);
  }

  create(input: JournalInput): Promise<JournalRow> {
    if (!input.title && !input.body) {
      throw new RepositoryError(
        'JournalService.create: a journal entry requires a title or body.',
        { code: 'VALIDATION' },
      );
    }
    return journalRepository.create(input);
  }

  update(id: string, patch: JournalPatch): Promise<JournalRow> {
    return journalRepository.update(id, patch);
  }

  remove(id: string): Promise<void> {
    return journalRepository.remove(id);
  }
}

export type { JournalRow };
export const journalService = new JournalService();
export { RepositoryError };
export default journalService;
