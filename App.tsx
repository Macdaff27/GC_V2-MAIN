import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Alert,
  ActivityIndicator,
  FlatList,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import AppText from './AppText';
import ClientFormModal from './src/components/ClientFormModal';
import ClientCard from './src/components/ClientCard';
import DatabaseToggle from './src/components/DatabaseToggle';
import SearchBar from './src/components/SearchBar';
import DataActions from './src/components/DataActions';
import ThemeToggle from './src/components/ThemeToggle';
import SortButton from './src/components/SortButton';
import Stats from './src/components/Stats';
import FloatingActionButton from './src/components/FloatingActionButton';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { useDatabase } from './src/hooks/useDatabase';
import { useClientActions } from './src/hooks/useClientActions';
import { useClientFilters } from './src/hooks/useClientFilters';
import { useClientData } from './src/hooks/useClientData';
import { useSmartScroll } from './src/hooks/useSmartScroll';

import type {
  Palette,
  ClientWithRelations,
  DatabaseName,
  ClientFormValues,
} from './src/types';

function App(): React.JSX.Element {
  const systemIsDark = useColorScheme() === 'dark'; 
  const [manualDarkMode, setManualDarkMode] = useState<boolean | null>(null);
  const isDarkMode = manualDarkMode ?? systemIsDark;
  const [clients, setClients] = useState<ClientWithRelations[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [formInitialValues, setFormInitialValues] = useState<ClientFormValues | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [activeDatabase, setActiveDatabase] = useState<DatabaseName>('main');

  const mainDb = useDatabase({ databaseName: 'main' });
  const archiveDb = useDatabase({ databaseName: 'archive' });
  const activeDb = activeDatabase === 'main' ? mainDb : archiveDb;

  const {
    loadClients: loadDbClients,
    createClient: createDbClient,
    clearAllData: clearDbAllData,
    isReady,
    error: dbError,
  } = activeDb;
  const mainDbReady = mainDb.isReady;
  const archiveDbReady = archiveDb.isReady;



  const palette = useMemo<Palette>(() => (
    isDarkMode
      ? {
          background: '#0F172A',
          surface: 'rgba(15, 23, 42, 0.72)',
          surfaceBorder: 'rgba(148, 163, 184, 0.14)',
          accent: '#38BDF8',
          textPrimary: '#F8FAFC',
          textSecondary: '#CBD5F5',
          searchBackground: 'rgba(30, 41, 59, 0.92)',
          searchPlaceholder: 'rgba(248, 250, 252, 0.55)',
          actionButtonBackground: 'rgba(148, 163, 184, 0.24)',
          actionButtonBackgroundDisabled: 'rgba(148, 163, 184, 0.12)',
          actionButtonText: '#F8FAFC',
        }
      : {
          background: '#F1F5F9',
          surface: 'rgba(255, 255, 255, 0.88)',
          surfaceBorder: 'rgba(148, 163, 184, 0.20)',
          accent: '#0284C7',
          textPrimary: '#0F172A',
          textSecondary: '#475569',
          searchBackground: '#E2E8F0',
          searchPlaceholder: 'rgba(15, 23, 42, 0.45)',
          actionButtonBackground: '#E2E8F0',
          actionButtonBackgroundDisabled: 'rgba(226, 232, 240, 0.65)',
          actionButtonText: '#1E293B',
        }
  ), [isDarkMode]);

  // Client filters hook
  const clientFilters = useClientFilters({ clients });

  // Smart scroll hook
  const smartScroll = useSmartScroll({
    clients,
    filteredClients: clientFilters.filteredClients,
    searchFilteredClients: clientFilters.searchFilteredClients,
    searchQuery: clientFilters.searchQuery,
    statusFilter: clientFilters.statusFilter,
    setSearchQuery: clientFilters.setSearchQuery,
    setStatusFilter: clientFilters.setStatusFilter,
  });

  // Client data hook
  const clientData = useClientData({
    clients,
    isReady,
    createClient: createDbClient,
    clearAllData: clearDbAllData,
    onLoadClients: () => Promise.resolve(), // Placeholder, will be updated
  });

  const loadClients = useCallback(async () => {
    if (!isReady) {
      return;
    }

    clientData.setLoading(true);
    try {
      const data = await loadDbClients();
      setClients(data);
    } catch (error) {
      console.error('Erreur lors du chargement des clientes', error);
      const message = error instanceof Error && error.message
        ? error.message
        : 'Impossible de charger les clientes.';
      Alert.alert('Erreur', message);
    } finally {
      clientData.setLoading(false);
    }
  }, [isReady, loadDbClients, clientData]);

  // Client actions hook
  const clientActions = useClientActions({
    activeDatabase,
    onLoadClients: loadClients,
    onSetFormVisible: setFormVisible,
    onSetFormInitialValues: setFormInitialValues,
    onSetFormSubmitting: setFormSubmitting,
    onSetPendingScrollClientId: smartScroll.setPendingScrollClientId,
    onSetShouldRestoreScroll: smartScroll.setShouldRestoreScroll,
  });

  useEffect(() => {
    if (dbError) {
      console.error("Erreur d'initialisation SQLite", dbError);
      Alert.alert('Erreur', "Impossible d'initialiser la base de donn\u00E9es.");
      setClients([]);
      clientData.setLoading(false);
      return;
    }

    loadClients().catch(() => {});
  }, [dbError, loadClients, clientData]);



  const listEmptyComponent = useMemo(() => (
    <View style={styles.listEmpty}>
      {clientData.loading ? (
        <>
          <ActivityIndicator color={palette.accent} />
          <AppText style={[styles.emptyText, { color: palette.textSecondary }]}>Chargement...</AppText>
        </>
      ) : (
        <AppText style={[styles.emptyText, { color: palette.textSecondary }]}>Importez un fichier JSON pour commencer.</AppText>
      )}
    </View>
  ), [clientData.loading, palette]);




  const handleSelectDatabase = useCallback((dbName: DatabaseName) => {
    if (dbName === activeDatabase) {
      return;
    }
    clientData.setLoading(true);
    setClients([]);
    setActiveDatabase(dbName);
  }, [activeDatabase, clientData]);

const renderClient = useCallback(({ item }: { item: ClientWithRelations }) => (
    <ClientCard
      client={item}
      palette={palette}
      onToggleStatus={clientActions.handleToggleStatus}
      onEdit={clientActions.handleEditClient}
      onDelete={clientActions.handleDeleteClient}
      activeDatabase={activeDatabase}
      onArchive={clientActions.handleArchiveClient}
      onUnarchive={clientActions.handleUnarchiveClient}
    />
  ), [activeDatabase, clientActions, palette]);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        <View style={styles.glow} />

        <View
          style={styles.controls}
        >
          <DatabaseToggle
            activeDatabase={activeDatabase}
            palette={palette}
            mainReady={mainDbReady}
            archiveReady={archiveDbReady}
            onSelect={handleSelectDatabase}
          />

          <SearchBar
            value={clientFilters.searchQuery}
            onChangeText={clientFilters.setSearchQuery}
            palette={palette}
          />

          <DataActions
            onExport={clientData.triggerExport}
            onImport={clientData.triggerImport}
            isExporting={clientData.isExporting}
            isImporting={clientData.isImporting}
            clientsCount={clients.length}
            palette={palette}
          />

          <Stats
            statusFilter={clientFilters.statusFilter}
            onFilterChange={clientFilters.setStatusFilter}
            counts={clientFilters.statusCounts}
            palette={palette}
          />

          <ThemeToggle
            isDark={manualDarkMode ?? systemIsDark}
            onToggle={(value: boolean) => setManualDarkMode(value ? true : value === false ? false : null)}
            palette={palette}
          />

          <SortButton
            isAscending={clientFilters.isSortAscending}
            onToggle={() => clientFilters.setIsSortAscending(!clientFilters.isSortAscending)}
            palette={palette}
          />
        </View>

        <FlatList
          ref={smartScroll.listRef}
          data={clientFilters.filteredClients}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderClient}
          removeClippedSubviews={false}
          contentContainerStyle={[
            styles.listContent,
            clientFilters.filteredClients.length === 0 ? styles.listEmptyContainer : null,
          ]}
          ListEmptyComponent={listEmptyComponent}
          onScroll={smartScroll.handleScroll}
          scrollEventThrottle={16}
        />

        <FloatingActionButton
          onPress={clientActions.handleCreateClient}
          palette={palette}
          accessibilityLabel="Ajouter une cliente"
        />
      </SafeAreaView>
      <ClientFormModal
        visible={formVisible}
        palette={palette}
        initialValues={formInitialValues}
        onClose={clientActions.handleCloseForm}
        onSubmit={clientActions.handleSubmitClientForm}
        submitting={formSubmitting}
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  glow: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    transform: [{ rotate: '25deg' }],
  },
  controls: {
    gap: 12,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 48,
    gap: 16,
  },
  listEmptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  listEmpty: {
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
});

export default App;
