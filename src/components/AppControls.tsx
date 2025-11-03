import React from 'react';
import { View, StyleSheet } from 'react-native';
import DatabaseToggle from './DatabaseToggle';
import SearchBar from './SearchBar';
import DataActions from './DataActions';
import Stats from './Stats';
import ThemeToggle from './ThemeToggle';
import SortButton from './SortButton';
import type { Palette, DatabaseName, StatusFilter } from '../types';

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
  return (
    <View style={styles.controls}>
      <DatabaseToggle
        activeDatabase={activeDatabase}
        palette={palette}
        mainReady={mainReady}
        archiveReady={archiveReady}
        onSelect={onSelectDatabase}
      />

      <SearchBar
        value={searchQuery}
        onChangeText={onChangeSearchQuery}
        palette={palette}
      />

      <DataActions
        onExport={onExport}
        onImport={onImport}
        isExporting={isExporting}
        isImporting={isImporting}
        clientsCount={clientsCount}
        palette={palette}
      />

      <Stats
        statusFilter={statusFilter}
        onFilterChange={onChangeStatusFilter}
        counts={statusCounts}
        palette={palette}
      />

      <ThemeToggle
        isDark={isDark ?? systemIsDark}
        onToggle={onToggleTheme}
        palette={palette}
      />

      <SortButton
        isAscending={isSortAscending}
        onToggle={onToggleSort}
        palette={palette}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  controls: {
    gap: 12,
    marginBottom: 16,
  },
});

export default AppControls;
