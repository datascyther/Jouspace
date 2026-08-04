import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface MessageTimestampProps {
  date: Date;
  style?: any;
}

function formatMessageDate(date: Date): string {
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export function MessageTimestamp({ date, style }: MessageTimestampProps) {
  const { colors } = useTheme();

  return (
    <Text
      style={[
        styles.timestamp,
        { color: colors.text.secondary, opacity: 0.6 },
        style,
      ]}
    >
      {formatMessageDate(date)}
    </Text>
  );
}

const styles = StyleSheet.create({
  timestamp: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
});

export default MessageTimestamp;
