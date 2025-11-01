
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import type { Palette } from '../types';
import AppText from '../../AppText';

type StatusFilter = 'all' | 'in-progress' | 'done';

interface StatsProps {
  statusFilter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
  counts: {
    total: number;
    inProgress: number;
    done: number;
  };
  palette: Palette;
}

const filterOptions: Array<{
  key: StatusFilter;
  icon: string;
  countKey: keyof StatsProps['counts'];
}> = [
  { key: 'all', icon: '\uD83D\uDDC2', countKey: 'total' },
  { key: 'in-progress', icon: '\u23F3', countKey: 'inProgress' },
  { key: 'done', icon: '\u2705', countKey: 'done' },
];

function Stats({ statusFilter, onFilterChange, counts, palette }: StatsProps): React.JSX.Element {
  return (
    <View style={styles.filterBar}>
      {filterOptions.map((option) => {
        const selected = statusFilter === option.key;
        return (
          <Pressable
            key={option.key}
            onPress={() => onFilterChange(option.key)}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.filterButton,
              {
                borderColor: palette.accent,
                backgroundColor: selected ? palette.accent : 'transparent',
              },
              pressed && styles.filterButtonPressed,
            ]}
          >
            <View style={styles.filterButtonContent}>
              <AppText
                style={[
                  styles.filterButtonIcon,
                  { color: selected ? palette.background : palette.textPrimary },
                ]}
              >
                {option.icon}
              </AppText>
              <AppText
                style={[
                  styles.filterButtonCount,
                  { color: selected ? palette.background : palette.textPrimary },
                ]}
              >
                {counts[option.countKey]}
              </AppText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  filterBar: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonPressed: {
    opacity: 0.85,
  },
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  filterButtonIcon: {
    fontSize: 16,
  },
  filterButtonCount: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Stats;
