/**
 * PasswordStrengthMeter — Visual password strength indicator
 *
 * Shows password requirements and strength level in real-time.
 * Reuses the design tokens and glassmorphism style.
 */

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { PASSWORD_REQUIREMENTS } from '@/features/auth/constants';

interface PasswordStrengthMeterProps {
  password: string;
}

function getStrength(password: string): {
  score: number;
  label: string;
  color: string;
  progress: number;
} {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{}|;':"\\,.<>\/?`~]/.test(password)) score += 1;

  const progress = Math.min(score / 6, 1);

  if (score <= 1) return { score, label: 'Weak', color: '#F87171', progress };
  if (score <= 3) return { score, label: 'Fair', color: '#FBBF24', progress };
  if (score <= 4) return { score, label: 'Good', color: '#38BDF8', progress };
  return { score, label: 'Strong', color: '#34D399', progress };
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => getStrength(password), [password]);
  const requirements = useMemo(
    () =>
      PASSWORD_REQUIREMENTS.map((req) => ({
        ...req,
        met: req.test(password),
      })),
    [password]
  );

  if (!password) return null;

  return (
    <View className="mt-2 mb-4">
      {/* Strength bar */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-white/50 text-caption font-medium">
          Password Strength
        </Text>
        <Text
          style={{ color: strength.color }}
          className="text-caption font-semibold"
        >
          {strength.label}
        </Text>
      </View>

      <View className="h-1.5 bg-jouspace-glass-highlight rounded-full overflow-hidden">
        <View
          style={{
            width: `${strength.progress * 100}%`,
            backgroundColor: strength.color,
          }}
          className="h-full rounded-full transition-all"
        />
      </View>

      {/* Requirements list */}
      <View className="mt-3 bg-jouspace-glass-dark/20 rounded-glass p-3 border border-jouspace-glass-border/50">
        <Text className="text-white/50 text-caption font-medium mb-2">
          Requirements:
        </Text>
        {requirements.map((req, index) => (
          <View key={index} className="flex-row items-center py-0.5">
            {req.met ? (
              <Check size={12} color="#34D399" />
            ) : (
              <X size={12} color="#F87171" />
            )}
            <Text
              className={`text-caption ml-2 ${
                req.met ? 'text-status-success' : 'text-white/40'
              }`}
            >
              {req.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default PasswordStrengthMeter;