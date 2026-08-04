/**
 * Jouspace — Auth Feature Constants
 *
 * Feature-specific constants for auth screens and flows.
 */

export const AUTH_STRINGS = {
  // Splash
  SPLASH_TITLE: 'Jouspace',
  SPLASH_SUBTITLE: 'Your personal wellness companion',

  // Login
  LOGIN_TITLE: 'Welcome Back',
  LOGIN_SUBTITLE: 'Sign in to continue your wellness journey',
  LOGIN_EMAIL_LABEL: 'Email',
  LOGIN_EMAIL_PLACEHOLDER: 'Enter your email',
  LOGIN_PASSWORD_LABEL: 'Password',
  LOGIN_PASSWORD_PLACEHOLDER: 'Enter your password',
  LOGIN_BUTTON: 'Sign In',
  LOGIN_FORGOT_PASSWORD: 'Forgot Password?',
  LOGIN_NO_ACCOUNT: "Don't have an account?",
  LOGIN_SIGNUP_CTA: 'Create One',
  LOGIN_GOOGLE_BUTTON: 'Continue with Google',

  // Signup
  SIGNUP_TITLE: 'Create Account',
  SIGNUP_SUBTITLE: 'Start your wellness journey with Jouspace',
  SIGNUP_NAME_LABEL: 'Full Name',
  SIGNUP_NAME_PLACEHOLDER: 'Enter your full name',
  SIGNUP_EMAIL_LABEL: 'Email',
  SIGNUP_EMAIL_PLACEHOLDER: 'Enter your email',
  SIGNUP_PASSWORD_LABEL: 'Password',
  SIGNUP_PASSWORD_PLACEHOLDER: 'Create a password',
  SIGNUP_CONFIRM_PASSWORD_LABEL: 'Confirm Password',
  SIGNUP_CONFIRM_PASSWORD_PLACEHOLDER: 'Confirm your password',
  SIGNUP_BUTTON: 'Create Account',
  SIGNUP_TERMS: 'I agree to the Terms of Service',
  SIGNUP_PRIVACY: 'I agree to the Privacy Policy',
  SIGNUP_HAS_ACCOUNT: 'Already have an account?',
  SIGNUP_LOGIN_CTA: 'Sign In',

  // Forgot Password
  FORGOT_TITLE: 'Reset Password',
  FORGOT_SUBTITLE: "Enter your email and we'll send you a reset link",
  FORGOT_EMAIL_LABEL: 'Email',
  FORGOT_EMAIL_PLACEHOLDER: 'Enter your email',
  FORGOT_BUTTON: 'Send Reset Link',
  FORGOT_BACK: 'Back to Sign In',
  FORGOT_SUCCESS_TITLE: 'Email Sent',
  FORGOT_SUCCESS_MESSAGE:
    'If an account exists with that email, you will receive a password reset link shortly.',

  // Email Verification
  VERIFICATION_TITLE: 'Verify Your Email',
  VERIFICATION_SUBTITLE:
    "We've sent a verification link to your email. Please check your inbox.",
  VERIFICATION_RESEND: 'Resend Email',
  VERIFICATION_REFRESH: "I've Verified",
  VERIFICATION_CONTINUE: 'Continue',
  VERIFICATION_SKIP: 'Skip for now',
  VERIFICATION_RESENT: 'Verification email resent!',

  // Onboarding
  ONBOARDING_TITLE: 'Welcome to Jouspace',
  ONBOARDING_SUBTITLE: "Let's personalize your experience",
  ONBOARDING_NAME_LABEL: 'What should we call you?',
  ONBOARDING_NAME_PLACEHOLDER: 'Your first name',
  ONBOARDING_GOAL_TITLE: 'What brings you here?',
  ONBOARDING_GOAL_SUBTITLE: 'Select your primary wellness goal',
  ONBOARDING_REMINDER_TITLE: 'Daily Check-in',
  ONBOARDING_REMINDER_SUBTITLE: 'When would you like to check in?',
  ONBOARDING_NOTIFICATIONS_TITLE: 'Notifications',
  ONBOARDING_NOTIFICATIONS_SUBTITLE:
    'Allow notifications for daily reminders?',
  ONBOARDING_THEME_TITLE: 'Theme Preference',
  ONBOARDING_THEME_SUBTITLE: 'Choose your preferred theme',
  ONBOARDING_COMPLETE_TITLE: "You're All Set!",
  ONBOARDING_COMPLETE_SUBTITLE: 'Let’s begin your wellness journey',
  ONBOARDING_BUTTON: 'Get Started',
  ONBOARDING_SKIP: 'Skip',

  // Errors
  ERROR_NETWORK: 'Network error. Please check your connection.',
  ERROR_INVALID_CREDENTIALS: 'Invalid email or password.',
  ERROR_EMAIL_EXISTS: 'An account with this email already exists.',
  ERROR_WEAK_PASSWORD: 'Password is too weak. Please choose a stronger password.',
  ERROR_TOO_MANY_REQUESTS: 'Too many attempts. Please try again later.',
  ERROR_USER_DISABLED: 'This account has been disabled.',
  ERROR_USER_NOT_FOUND: 'No account found with this email.',
  ERROR_WRONG_PASSWORD: 'Incorrect password. Please try again.',
  ERROR_EMAIL_NOT_VERIFIED: 'Please verify your email before continuing.',
  ERROR_GENERIC: 'Something went wrong. Please try again.',
  ERROR_SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
} as const;

export const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'Special character', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{}|;':"\\,.<>\/?`~]/.test(p) },
] as const;

export const WELLNESS_GOALS = [
  { value: 'manage_anxiety' as const, label: 'Manage Anxiety', emoji: '🧘', description: 'Learn coping strategies and techniques' },
  { value: 'reduce_stress' as const, label: 'Reduce Stress', emoji: '🌿', description: 'Develop stress management techniques' },
  { value: 'improve_sleep' as const, label: 'Improve Sleep', emoji: '😴', description: 'Build better sleep hygiene' },
  { value: 'build_habits' as const, label: 'Build Healthy Habits', emoji: '⭐', description: 'Create positive daily routines' },
  { value: 'practice_mindfulness' as const, label: 'Practice Mindfulness', emoji: '🧠', description: 'Build meditation and awareness habits' },
  { value: 'track_mood' as const, label: 'Track Mood', emoji: '💜', description: 'Monitor emotional patterns and trends' },
  { value: 'general_wellness' as const, label: 'General Wellness', emoji: '🌟', description: 'Overall wellness and self-care' },
] as const;

export const REMINDER_OPTIONS = [
  { value: 'morning' as const, label: 'Morning', emoji: '🌅', description: 'Start your day with intention' },
  { value: 'afternoon' as const, label: 'Afternoon', emoji: '☀️', description: 'Mid-day check-in' },
  { value: 'evening' as const, label: 'Evening', emoji: '🌆', description: 'Evening reflection' },
  { value: 'none' as const, label: 'No Reminders', emoji: '🔕', description: "I'll check in when I feel like it" },
] as const;
