/**
 * Jouspace — Onboarding Feature Constants
 *
 * Constants specific to the onboarding flow.
 */

export const WELLNESS_GOALS = [
  {
    value: 'reduce_anxiety',
    label: 'Reduce Anxiety',
    emoji: '🧘',
    description: 'Learn coping strategies and techniques',
  },
  {
    value: 'improve_mood',
    label: 'Improve Mood',
    emoji: '🌞',
    description: 'Boost overall happiness and positivity',
  },
  {
    value: 'sleep_better',
    label: 'Sleep Better',
    emoji: '😴',
    description: 'Build better sleep hygiene and routines',
  },
  {
    value: 'build_habits',
    label: 'Build Healthy Habits',
    emoji: '⭐',
    description: 'Create positive daily routines',
  },
  {
    value: 'manage_stress',
    label: 'Manage Stress',
    emoji: '🌿',
    description: 'Learn effective stress management techniques',
  },
  {
    value: 'emotional_support',
    label: 'Emotional Support',
    emoji: '💜',
    description: 'Get compassionate support when needed',
  },
  {
    value: 'self_reflection',
    label: 'Self Reflection',
    emoji: '🪞',
    description: 'Deepen self-awareness and insight',
  },
] as const;

export const MOOD_OPTIONS = [
  { value: 'calm', label: 'Calm', emoji: '😌' },
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
  { value: 'overwhelmed', label: 'Overwhelmed', emoji: '😵' },
  { value: 'stressed', label: 'Stressed', emoji: '😤' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'sad', label: 'Sad', emoji: '😔' },
] as const;

export const REMINDER_OPTIONS = [
  {
    value: 'morning',
    label: 'Morning',
    emoji: '🌅',
    description: 'Start your day with intention',
  },
  {
    value: 'afternoon',
    label: 'Afternoon',
    emoji: '☀️',
    description: 'Mid-day check-in',
  },
  {
    value: 'evening',
    label: 'Evening',
    emoji: '🌆',
    description: 'Evening reflection',
  },
  {
    value: 'none',
    label: 'No Reminders',
    emoji: '🔕',
    description: "I'll check in when I feel like it",
  },
] as const;

export const TOTAL_ONBOARDING_STEPS = 7;

export const ONBOARDING_STRINGS = {
  WELCOME_TITLE: 'Welcome to Jouspace',
  WELCOME_SUBTITLE: 'Your personal AI wellness companion',
  WELCOME_DESCRIPTION:
    'Together, we\'ll build healthier habits, manage stress, and cultivate mindfulness. Let\'s get to know you a little better.',
  GOALS_TITLE: 'What brings you here?',
  GOALS_SUBTITLE: 'Select all that apply',
  MOOD_TITLE: 'How are you feeling recently?',
  MOOD_SUBTITLE: 'This helps us personalize your experience',
  MOOD_NOTE_PLACEHOLDER: 'Anything you\'d like to add...',
  NAME_TITLE: 'Choose a display name',
  NAME_SUBTITLE: 'This is how we\'ll address you in the app',
  NAME_PLACEHOLDER: 'Your name or nickname',
  REMINDER_TITLE: 'Daily Check-in',
  REMINDER_SUBTITLE: 'When would you like to check in?',
  PERMISSION_TITLE: 'Notifications',
  PERMISSION_SUBTITLE:
    'We\'ll send gentle reminders for your daily check-ins and wellness moments.',
  PERMISSION_BUTTON: 'Enable Notifications',
  PERMISSION_SKIP: 'Maybe later',
  PRIVACY_TITLE: 'Your Privacy Matters',
  PRIVACY_SUBTITLE:
    'Your conversations and personal data remain private. All information is encrypted end-to-end, and you always control your data.',
  PRIVACY_ACKNOWLEDGE: 'I Understand',
  PREPARING_TITLE: 'Preparing your experience',
  PREPARING_SUBTITLE: 'Creating your personalized wellness profile...',
  BACK: 'Back',
  CONTINUE: 'Continue',
  GET_STARTED: "Let's Begin",
} as const;
