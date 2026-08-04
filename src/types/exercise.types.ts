// Type definitions for different exercise types
export interface MeditationExercise {
  id: string;
  title: string;
  description: string;
  duration: number;
  type: 'guided';
  audioGuided: boolean;
  instructions: string[];
}

export interface JournalingExercise {
  id: string;
  title: string;
  description: string;
  duration: number;
  type: 'journal';
  prompts: string[];
}

export interface ADHDGameExercise {
  id: string;
  title: string;
  description: string;
  duration: number;
  type: 'adhd_game';
  gameType: string;
  instructions: string[];
}

export interface BreathingExercise {
  id: string;
  title: string;
  description: string;
  duration: number;
  type: 'breathing';
  pattern: {
    inhale: number;
    hold: number;
    exhale: number;
    pause?: number;
  };
  instructions: string[];
}

export type Exercise = MeditationExercise | JournalingExercise | ADHDGameExercise | BreathingExercise;

// Type guards
export function isJournalingExercise(exercise: Exercise): exercise is JournalingExercise {
  return exercise.type === 'journal';
}

export function isADHDGameExercise(exercise: Exercise): exercise is ADHDGameExercise {
  return exercise.type === 'adhd_game';
}

export function isMeditationExercise(exercise: Exercise): exercise is MeditationExercise {
  return exercise.type === 'guided';
}

export function isBreathingExercise(exercise: Exercise): exercise is BreathingExercise {
  return exercise.type === 'breathing';
}
