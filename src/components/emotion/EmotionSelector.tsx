import React from 'react';
import { View, StyleSheet } from 'react-native';
import { EmotionCard } from './EmotionCard';
import { EMOTION_ORDER, type EmotionType } from '@/constants/emotions';

export interface EmotionSelectorProps {
  selectedEmotion: EmotionType | null;
  onSelect: (emotion: EmotionType) => void;
}

export function EmotionSelector({
  selectedEmotion,
  onSelect,
}: EmotionSelectorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {EMOTION_ORDER.map((emotion) => (
          <EmotionCard
            key={emotion}
            emotion={emotion}
            selected={selectedEmotion === emotion}
            onPress={() => onSelect(emotion)}
            size={34}
            showLabel
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
});

export default EmotionSelector;
