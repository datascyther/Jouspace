/**
 * Jouspace — Onboarding Validation Schemas
 *
 * Zod schemas for onboarding steps. Validation rules live here — never in components.
 */

import { z } from 'zod';

// ─── Shared rules ────────────────────────────────────────────────────────

const displayNameSchema = z
  .string()
  .min(1, 'Name is required')
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(
    /^[a-zA-Z\s'-]+$/,
    'Name can only contain letters, spaces, hyphens, and apostrophes'
  );

const goalsSchema = z
  .array(z.string())
  .min(1, 'Select at least one goal')
  .max(5, 'Select up to 5 goals');

const moodSchema = z.string().min(1, 'Please select your current mood');

const reminderSchema = z.enum(
  ['morning', 'afternoon', 'evening', 'none'],
  {
    required_error: 'Please select a reminder preference',
  }
);

// ─── Schemas ─────────────────────────────────────────────────────────────

export const displayNameStepSchema = z.object({
  displayName: displayNameSchema,
});

export const goalsStepSchema = z.object({
  primaryGoals: goalsSchema,
});

export const moodStepSchema = z.object({
  initialMood: moodSchema,
});

export const reminderStepSchema = z.object({
  reminderPreference: reminderSchema,
});

export const completeOnboardingSchema = z.object({
  displayName: displayNameSchema,
  primaryGoals: goalsSchema,
  initialMood: moodSchema,
  reminderPreference: reminderSchema,
  notificationsEnabled: z.boolean(),
});

// ─── Types ───────────────────────────────────────────────────────────────

export type DisplayNameStepData = z.infer<typeof displayNameStepSchema>;
export type GoalsStepData = z.infer<typeof goalsStepSchema>;
export type MoodStepData = z.infer<typeof moodStepSchema>;
export type ReminderStepData = z.infer<typeof reminderStepSchema>;
export type CompleteOnboardingData = z.infer<
  typeof completeOnboardingSchema
>;
