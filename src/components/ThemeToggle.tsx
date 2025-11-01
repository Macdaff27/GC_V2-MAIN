
import React from 'react';
import { View, StyleSheet, Switch } from 'react-native';
import type { Palette } from '../types';
import AppText from '../../AppText';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: (value: boolean) => void;
  palette: Palette;
}

function ThemeToggle({ isDark, onToggle, palette }: ThemeToggleProps): React.JSX.Element {
  return (
    <View style={styles.themeControls}>
      <AppText style={[styles.themeLabel, { color: palette.textSecondary }]}>Thème sombre</AppText>
      <Switch
        value={isDark}
        onValueChange={onToggle}
        thumbColor={isDark ? palette.accent : palette.surfaceBorder}
        trackColor={{ true: palette.accent, false: palette.surfaceBorder }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  themeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    backgroundColor: 'rgba(148, 163, 184, 0.05)',
  },
  themeLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ThemeToggle;
