import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';

import AppText from '../../AppText';
import type { Palette, DatabaseName } from '../types';

export type DatabaseToggleProps = {
  activeDatabase: DatabaseName;
  palette: Palette;
  mainReady: boolean;
  archiveReady: boolean;
  onSelect: (target: DatabaseName) => void;
};

function DatabaseToggle({
  activeDatabase,
  palette,
  mainReady,
  archiveReady,
  onSelect,
}: DatabaseToggleProps) {
  return (
    <View style={styles.databaseToggle}>
      <Pressable
        onPress={() => onSelect('main')}
        style={({ pressed }) => [
          styles.databaseToggleButton,
          activeDatabase === 'main' && styles.databaseToggleButtonActive,
          {
            borderColor: palette.accent,
            backgroundColor: activeDatabase === 'main' ? palette.accent : 'transparent',
          },
          pressed && styles.databaseToggleButtonPressed,
        ]}
      >
        <AppText
          style={[
            styles.databaseToggleText,
            { color: activeDatabase === 'main' ? palette.background : palette.textPrimary },
          ]}
        >
          Actives ({mainReady ? 'OK' : '...'})
        </AppText>
      </Pressable>

      <Pressable
        onPress={() => onSelect('archive')}
        style={({ pressed }) => [
          styles.databaseToggleButton,
          activeDatabase === 'archive' && styles.databaseToggleButtonActive,
          {
            borderColor: palette.accent,
            backgroundColor: activeDatabase === 'archive' ? palette.accent : 'transparent',
          },
          pressed && styles.databaseToggleButtonPressed,
        ]}
      >
        <AppText
          style={[
            styles.databaseToggleText,
            { color: activeDatabase === 'archive' ? palette.background : palette.textPrimary },
          ]}
        >
          Archives ({archiveReady ? 'OK' : '...'})
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  databaseToggle: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  databaseToggleButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  databaseToggleButtonActive: {},
  databaseToggleButtonPressed: {
    opacity: 0.8,
  },
  databaseToggleText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default DatabaseToggle;
