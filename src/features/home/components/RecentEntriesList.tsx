import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/core/theme';
import { RecentEntryRow } from './RecentEntryRow';
import type { RecentEntry } from '@/features/home/hooks/useHomeData';

export interface RecentEntriesListProps {
  entries: RecentEntry[];
  onEntryPress?: (entry: RecentEntry) => void;
}

export function RecentEntriesList({ entries, onEntryPress }: RecentEntriesListProps) {
  const { colors } = useTheme();

  if (entries.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
        Recent entries
      </Text>
      <View style={styles.listContainer}>
        {entries.map((entry, idx) => (
          <View key={entry.id}>
            {idx > 0 && <View style={styles.divider} />}
            <RecentEntryRow
              dateLabel={entry.dateLabel}
              title={entry.title}
              tag={entry.tag}
              onPress={() => onEntryPress?.(entry)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // aiCardToRecent
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '500',
    fontFamily: typography.fontFamily.display,
    marginBottom: 8,
    lineHeight: 26,
  },
  listContainer: {
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E9E4E0',
  },
});

export default RecentEntriesList;
