import React from 'react';
import { View, StyleSheet, Pressable, TextInput, Switch } from 'react-native';
import Stats from './Stats';
import type { Palette, DatabaseName, StatusFilter } from '../types';
import AppText from '../../AppText';

export interface AppControlsProps {
  // Database
  activeDatabase: DatabaseName;
  mainReady: boolean;
  archiveReady: boolean;
  onSelectDatabase: (dbName: DatabaseName) => void;

  // Search & Filters
  searchQuery: string;
  onChangeSearchQuery: (query: string) => void;
  statusFilter: StatusFilter;
  onChangeStatusFilter: (filter: StatusFilter) => void;
  statusCounts: {
    total: number;
    inProgress: number;
    done: number;
  };
  isSortAscending: boolean;
  onToggleSort: () => void;

  // Data Actions
  onExport: () => void;
  onImport: () => void;
  isExporting: boolean;
  isImporting: boolean;
  clientsCount: number;

  // Theme
  isDark: boolean | null;
  systemIsDark: boolean;
  onToggleTheme: (value: boolean) => void;

  // Palette
  palette: Palette;
}

export const AppControls: React.FC<AppControlsProps> = ({
  activeDatabase,
  mainReady,
  archiveReady,
  onSelectDatabase,
  searchQuery,
  onChangeSearchQuery,
  statusFilter,
  onChangeStatusFilter,
  statusCounts,
  isSortAscending,
  onToggleSort,
  onExport,
  onImport,
  isExporting,
  isImporting,
  clientsCount,
  isDark,
  systemIsDark,
  onToggleTheme,
  palette,
}) => {
  const isExportDisabled = isExporting || clientsCount === 0;
  const exportLabel = isExporting ? 'Export en cours...' : 'Exporter';
  const importLabel = isImporting ? 'Import en cours...' : 'Importer';

  return (
    <View style={styles.controls}>
      {/* Database Toggle - Intégré depuis DatabaseToggle.tsx */}
      <View style={styles.databaseToggle}>
        <Pressable
          onPress={() => onSelectDatabase('main')}
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
          onPress={() => onSelectDatabase('archive')}
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

      {/* Search Bar - Intégré depuis SearchBar.tsx */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: palette.searchBackground,
            borderColor: palette.surfaceBorder,
          },
        ]}
      >
        <TextInput
          value={searchQuery}
          onChangeText={onChangeSearchQuery}
          style={[styles.searchInput, { color: palette.textPrimary }]}
          placeholder="Filtrer par nom, page ou note..."
          placeholderTextColor={palette.searchPlaceholder}
          selectionColor={palette.accent}
          returnKeyType="search"
          accessibilityLabel="Barre de recherche des clientes"
        />
      </View>

      {/* Data Actions - Intégré depuis DataActions.tsx */}
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

      {/* Stats - Gardé séparé (plus complexe) */}
      <Stats
        statusFilter={statusFilter}
        onFilterChange={onChangeStatusFilter}
        counts={statusCounts}
        palette={palette}
      />

      {/* Theme Toggle - Intégré depuis ThemeToggle.tsx */}
      <View style={styles.themeControls}>
        <AppText style={[styles.themeLabel, { color: palette.textSecondary }]}>Thème sombre</AppText>
        <Switch
          value={isDark ?? systemIsDark}
          onValueChange={onToggleTheme}
          thumbColor={(isDark ?? systemIsDark) ? palette.accent : palette.surfaceBorder}
          trackColor={{ true: palette.accent, false: palette.surfaceBorder }}
        />
      </View>

      {/* Sort Button - Intégré depuis SortButton.tsx */}
      <View style={styles.actions}>
        <Pressable
          onPress={onToggleSort}
          accessibilityRole="button"
          accessibilityLabel={isSortAscending
            ? 'Basculer en tri décroissant par numéro de page'
            : 'Basculer en tri croissant par numéro de page'}
          accessibilityHint="Modifier l'ordre de tri des clientes par numéro de page"
          style={({ pressed }) => [
            styles.singleActionButton,
            {
              backgroundColor: palette.actionButtonBackground,
              opacity: pressed ? 0.92 : 1,
            },
          ]}
        >
          <AppText
            style={[
              styles.singleActionButtonLabel,
              { color: palette.actionButtonText },
            ]}
          >
            {isSortAscending ? 'Page croissant' : 'Page décroissant'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  controls: {
    gap: 12,
    marginBottom: 16,
  },

  // Database Toggle styles
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

  // Search Bar styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // Data Actions styles
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

  // Theme Toggle styles
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

  // Sort Button styles
  actions: {
    marginTop: 10,
  },
  singleActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignSelf: 'stretch',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 5,
  },
  singleActionButtonLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});

export default AppControls;
