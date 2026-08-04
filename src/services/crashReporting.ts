import { logger } from '@/services/logging';

export const crashReporting = {
  initialized: false,

  init() {
    this.initialized = true;
    logger.info('general', 'Crash reporting initialized');
  },

  captureError(error: Error, context?: Record<string, unknown>) {
    if (!this.initialized) return;
    logger.error('general', 'Crash reported', { error: error.message, ...context });
  },

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    if (!this.initialized) return;
  },

  setUser(userId: string, email?: string, username?: string) {
    if (!this.initialized) return;
  },

  addBreadcrumb(message: string, category?: string) {
    if (!this.initialized) return;
  },
};
