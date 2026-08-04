/**
 * Profile Feature — Sign Out Button
 *
 * Destructive action button for signing out.
 */

import React from 'react';
import { LogOut } from 'lucide-react-native';
import { Button } from '@/shared/components/Button';
import { spacing } from '@/core/theme/tokens';

interface SignOutButtonProps {
  onPress: () => void;
  loading: boolean;
}

export const SignOutButton = React.memo(function SignOutButton({
  onPress,
  loading,
}: SignOutButtonProps) {
  return (
    <Button
      title="Sign Out"
      variant="destructive"
      size="md"
      icon={<LogOut size={18} />}
      loading={loading}
      onPress={onPress}
      style={styles.button}
    />
  );
});

const styles = {
  button: {
    marginTop: spacing.lg,
    marginBottom: spacing['2xl'],
  },
};

export default SignOutButton;
