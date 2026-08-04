/**
 * Profile Feature — Edit Profile Modal
 *
 * Modal for editing the user's display name.
 */

import React from 'react';
import { View } from 'react-native';
import { Modal } from '@/shared/components/Modal';
import { TextField } from '@/shared/components/TextField';
import { Button } from '@/shared/components/Button';
import { spacing } from '@/core/theme/tokens';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  editName: string;
  onEditNameChange: (name: string) => void;
  onSave: () => Promise<void>;
  updatingProfile: boolean;
}

export const EditProfileModal = React.memo(function EditProfileModal({
  visible,
  onClose,
  editName,
  onEditNameChange,
  onSave,
  updatingProfile,
}: EditProfileModalProps) {
  return (
    <Modal visible={visible} onClose={onClose} title="Edit Profile">
      <View style={{ paddingTop: spacing.sm }}>
        <TextField
          label="Display Name"
          placeholder="Enter your name"
          value={editName}
          onChangeText={onEditNameChange}
          autoFocus
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xl, gap: spacing.md }}>
          <Button
            title="Cancel"
            variant="secondary"
            onPress={onClose}
            style={{ flex: 1 }}
          />
          <Button
            title="Save"
            variant="primary"
            loading={updatingProfile}
            onPress={onSave}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </Modal>
  );
});

export default EditProfileModal;
