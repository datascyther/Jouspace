/**
 * PasswordField — Password input with visibility toggle
 */

import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { TextField } from './TextField';
import type { TextFieldProps } from './TextField';

interface PasswordFieldProps extends Omit<TextFieldProps, 'rightIcon' | 'secureTextEntry'> {
  showStrength?: boolean;
}

export function PasswordField({ showStrength = false, ...props }: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const iconColor = isDark ? 'rgba(255, 255, 255, 0.4)' : '#6B7280';

  return (
    <>
      <TextField
        {...props}
        secureTextEntry={!showPassword}
        rightIcon={
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? (
              <EyeOff size={18} color={iconColor} />
            ) : (
              <Eye size={18} color={iconColor} />
            )}
          </Pressable>
        }
      />
    </>
  );
}

export default PasswordField;
