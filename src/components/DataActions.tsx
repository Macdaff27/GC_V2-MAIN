
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import type { Palette } from '../types';
import AppText from '../../AppText';

interface DataActionsProps {
  onExport: () => void;
  onImport: () => void;
  isExporting: boolean;
  isImporting: boolean;
  clientsCount: number;
  palette: Palette;
}

function DataActions({
  onExport,
  onImport,
  isExporting,
  isImporting,
  clientsCount,
  palette,
}: DataActionsProps): React.JSX.Element {
  const isExportDisabled = isExporting || clientsCount === 0;
  const exportLabel = isExporting ? 'Export en cours...' : 'Exporter';
  const importLabel = isImporting ? 'Import en cours...' : 'Importer';

  return (
    <View style={styles.dataActions}>
      <Pressable
        onPress={onExport}
        disabled={isExportDisabled}
        accessibilityRole="button"
        accessibilityLabel="Exporter toutes les clientes en JSON"
        style={({ pressed }) => [
          styles.dataButton,
          {
            backgroundColor: palette.accent,
            borderColor: palette.accent,
            opacity: isExportDisabled ? 0.6 : pressed ? 0.85 : 1,
          },
        ]}
      >
        <AppText style={[styles.dataButtonText, { color: palette.background }]}>
          {exportLabel}
        </AppText>
      </Pressable>
      <Pressable
        onPress={onImport}
        disabled={isImporting}
        accessibilityRole="button"
        accessibilityLabel="Importer un fichier JSON de clientes"
        style={({ pressed }) => [
          styles.dataButton,
          {
            backgroundColor: 'transparent',
            borderColor: palette.accent,
            opacity: isImporting ? 0.6 : pressed ? 0.85 : 1,
          },
        ]}
      >
        <AppText style={[styles.dataButtonText, { color: palette.accent }]}>
          {importLabel}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  dataActions: {
    flexDirection: 'row',
    gap: 10,
  },
  dataButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataButtonText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default DataActions;
