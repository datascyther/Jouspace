import type { ComponentType } from 'react';
import { Heart, Wind, Sparkles, Moon } from 'lucide-react-native';

export interface ChatStarter {
  icon: ComponentType<{ size: number; color: string }>;
  text: string;
}

export const CHAT_STARTERS: ChatStarter[] = [
  { icon: Heart, text: "I'm feeling overwhelmed" },
  { icon: Wind, text: 'Help me calm racing thoughts' },
  { icon: Sparkles, text: 'Reflect on today' },
  { icon: Moon, text: "I can't sleep tonight" },
];

export interface MoodStarter {
  emoji: string;
  text: string;
}

export const MOOD_STARTERS: Record<string, MoodStarter[]> = {
  great: [
    { emoji: '🌅', text: "Let's build on this good energy" },
    { emoji: '🙏', text: 'What are you grateful for today?' },
    { emoji: '🎯', text: "Let's set an intention for today" },
  ],
  calm: [
    { emoji: '🧘', text: "Let's explore a guided reflection" },
    { emoji: '🌊', text: 'Want to try a breathing exercise?' },
    { emoji: '📓', text: 'Journal about your calm state' },
  ],
  sad: [
    { emoji: '🫂', text: "I'm here to listen. Tell me what's going on." },
    { emoji: '🌤️', text: "Let's try a gentle mood lift exercise" },
    { emoji: '💭', text: "Want to talk about what's weighing on you?" },
  ],
  frustrated: [
    { emoji: '💪', text: "Let's get it out. Tell me everything." },
    { emoji: '🧠', text: 'Try a CBT thought record' },
    { emoji: '🌬️', text: "Let's do a quick breathing exercise" },
  ],
  anxious: [
    { emoji: '🫁', text: "Let's take a breath together" },
    { emoji: '🗣️', text: "Tell me what's worrying you" },
    { emoji: '🌱', text: 'Try a grounding exercise' },
  ],
};
