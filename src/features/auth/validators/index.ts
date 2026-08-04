/**
 * Jouspace — Auth Validation Schemas
 *
 * Zod schemas for auth forms. Extends the shared schemas with
 * feature-specific validation rules.
 *
 * Validation rules live here — never in components.
 */

import { z } from 'zod';

// ─── Shared rules ───────────────────────────────────────────────────────

const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(254, 'Email must be less than 254 characters')
  .transform((email) => email.toLowerCase().trim());

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters');

const strongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[!@#$%^&*()_+\-=\[\]{}|;':"\\,.<>\/?`~]/,
    'Password must contain at least one special character'
  );

const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .regex(
    /^[a-zA-Z\s'-]+$/,
    'Name can only contain letters, spaces, hyphens, and apostrophes'
  );

// ─── Login Schema ───────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ─── Signup Schema ──────────────────────────────────────────────────────

export const signupSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms of service' }),
    }),
    acceptPrivacy: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the privacy policy' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

// ─── Forgot Password Schema ─────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ─── Onboarding Schema ──────────────────────────────────────────────────

export const onboardingSchema = z.object({
  firstName: nameSchema,
  wellnessGoal: z.enum(
    [
      'manage_anxiety',
      'reduce_stress',
      'improve_sleep',
      'build_habits',
      'practice_mindfulness',
      'track_mood',
      'general_wellness',
    ],
    { required_error: 'Please select a wellness goal' }
  ),
  dailyReminder: z.enum(['morning', 'afternoon', 'evening', 'none'], {
    required_error: 'Please select a reminder preference',
  }),
  notificationsEnabled: z.boolean(),
  theme: z.enum(['dark', 'light', 'auto']).default('dark'),
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;
