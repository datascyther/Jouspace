/**
 * NotificationService — application boundary for `notifications`.
 *
 * Thin facade over NotificationRepository. The ViewModel/UI must talk to this
 * service (never to the repository or Supabase directly), matching how
 * `AuthService` already works:
 *
 *    UI / ViewModel → NotificationService → NotificationRepository → Supabase
 */

import { notificationRepository } from '../repositories/NotificationRepository';
import type {
  NotificationInput,
  NotificationPatch,
} from '../repositories/NotificationRepository';
import { RepositoryError } from '../repositories/baseRepository';
import type { Database } from '../database.types';

type NotificationRow = Database['public']['Tables']['notifications']['Row'];

class NotificationService {
  list(unreadOnly = false): Promise<NotificationRow[]> {
    return notificationRepository.list(unreadOnly);
  }

  get(id: string): Promise<NotificationRow | null> {
    return notificationRepository.get(id);
  }

  create(input: NotificationInput): Promise<NotificationRow> {
    if (!input.title) {
      throw new RepositoryError('NotificationService.create: title is required.', {
        code: 'VALIDATION',
      });
    }
    return notificationRepository.create(input);
  }

  update(id: string, patch: NotificationPatch): Promise<NotificationRow> {
    return notificationRepository.update(id, patch);
  }

  markRead(id: string): Promise<NotificationRow> {
    return notificationRepository.markRead(id);
  }

  markAllRead(): Promise<void> {
    return notificationRepository.markAllRead();
  }

  remove(id: string): Promise<void> {
    return notificationRepository.remove(id);
  }
}

export type { NotificationRow };
export const notificationService = new NotificationService();
export { RepositoryError };
export default notificationService;
