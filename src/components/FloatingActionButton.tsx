import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import AppText from '../../AppText';
import type { Palette } from '../types';

type FloatingActionButtonProps = {
  onPress: () => void;
  palette: Palette;
  accessibilityLabel?: string;
};

const FloatingActionButton = React.memo(({
  onPress,
  palette,
  accessibilityLabel,
}: FloatingActionButtonProps): React.JSX.Element => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    style={({ pressed }) => [
      styles.fab,
      { backgroundColor: palette.accent, opacity: pressed ? 0.85 : 1 },
    ]}
  >
    <AppText style={[styles.fabLabel, { color: palette.background }]}>+</AppText>
  </Pressable>
));

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  fabLabel: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: -4,
  },
});

export default FloatingActionButton;
