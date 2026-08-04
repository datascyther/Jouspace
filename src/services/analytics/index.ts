import { analyticsRepository } from '../../../backend/repositories/AnalyticsRepository';
import type { Json } from '../../../backend/database.types';

export type AnalyticsEvent =
  | 'daily_checkin'
  | 'mood_logged'
  | 'journey_started'
  | 'journey_completed'
  | 'ai_conversation'
  | 'reflection_saved'
  | 'meditation_completed'
  | 'breathing_session_started'
  | 'breathing_session_completed'
  | 'meditation_session_started'
  | 'sleep_session_started'
  | 'sleep_session_completed'
  | 'subscription_purchased'
  | 'auth_signin'
  | 'auth_signup'
  | 'auth_signout'
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'onboarding_abandoned'
  | 'crisis_resource_accessed'
  | 'error_occurred'
  | 'login_attempt'
  | 'login_success'
  | 'login_failed'
  | 'password_reset';

export interface AnalyticsProperties {
  [key: string]: string | number | boolean | undefined | null;
}

class AnalyticsService {
  private enabled = true;

  init(): void {
    if (__DEV__) {
      console.log('[Analytics] Initialized');
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  trackEvent(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
    if (!this.enabled) return;

    if (__DEV__) {
      console.log(`[Analytics] ${event}`, properties ?? '');
    }

    try {
      void analyticsRepository.track({
        event_name: event,
        properties: (properties ?? {}) as unknown as Json,
      });
    } catch {
      // analytics failures never crash the app
    }
  }

  trackScreenView(screenName: string): void {
    this.trackEvent('ai_conversation' as AnalyticsEvent, { screen: screenName });
  }

  identifyUser(userId: string, traits?: Record<string, unknown>): void {
    if (__DEV__) {
      console.log(`[Analytics] Identify: ${userId}`, traits ?? '');
    }
  }

  reset(): void {
    // no-op
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
