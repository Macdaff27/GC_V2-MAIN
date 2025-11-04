import React, {
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  Alert,
  FlatList,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import AppText from './AppText';
import ClientFormModal from './src/components/ClientFormModal';
import ClientCard from './src/components/ClientCard';
import AppControls from './src/components/AppControls';
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
import { useAppState } from './src/hooks/useAppState';

import type {
  ClientWithRelations,
  DatabaseName,
} from './src/types';

function App(): React.JSX.Element {
  // Application state hook
  const appState = useAppState();

  const mainDb = useDatabase({ databaseName: 'main' });
  const archiveDb = useDatabase({ databaseName: 'archive' });
  const activeDb = appState.activeDatabase === 'main' ? mainDb : archiveDb;

  const {
    loadClients: loadDbClients,
    createClient: createDbClient,
    clearAllData: clearDbAllData,
    isReady,
    error: dbError,
  } = activeDb;
  const mainDbReady = mainDb.isReady;
  const archiveDbReady = archiveDb.isReady;



  // Client filters hook
  const clientFilters = useClientFilters({ clients: appState.clients }); 

  // Smart scroll hook
  const smartScroll = useSmartScroll({
    clients: appState.clients,
    filteredClients: clientFilters.filteredClients,
    searchFilteredClients: clientFilters.searchFilteredClients,
    searchQuery: clientFilters.searchQuery,
    statusFilter: clientFilters.statusFilter,
    setSearchQuery: clientFilters.setSearchQuery,
    setStatusFilter: clientFilters.setStatusFilter,
  });

  // Client data hook
  const clientData = useClientData({
    clients: appState.clients,
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
      appState.setClients(data);
    } catch (error) {
      console.error('Erreur lors du chargement des clientes', error);
      const message = error instanceof Error && error.message
        ? error.message
        : 'Impossible de charger les clientes.';
      Alert.alert('Erreur', message);
    } finally {
      clientData.setLoading(false);
    }
  }, [isReady, loadDbClients, clientData, appState]);

  // Client actions hook
  const clientActions = useClientActions({
    activeDatabase: appState.activeDatabase,
    onLoadClients: loadClients,
    onSetFormVisible: appState.setFormVisible,
    onSetFormInitialValues: appState.setFormInitialValues,
    onSetFormSubmitting: appState.setFormSubmitting,
    onSetPendingScrollClientId: smartScroll.setPendingScrollClientId,
    onSetShouldRestoreScroll: smartScroll.setShouldRestoreScroll,
  });

  useEffect(() => {
    if (dbError) {
      console.error("Erreur d'initialisation SQLite", dbError);
      Alert.alert('Erreur', "Impossible d'initialiser la base de donn\u00E9es.");
      appState.setClients([]);
      clientData.setLoading(false);
      return;
    }

    loadClients().catch(() => {});
  }, [dbError, loadClients, clientData, appState]);



  const listEmptyComponent = useMemo(() => {
    const totalClients = appState.clients.length;
    const filteredCount = clientFilters.filteredClientsCount;
    const textSecondaryColor = appState.palette.textSecondary;

    return (
      <View style={styles.listEmpty}>
        {totalClients > 0 && filteredCount === 0 ? (
          <AppText style={[styles.emptyText, { color: textSecondaryColor }]}>Aucune cliente trouvée</AppText>
        ) : (
          <AppText style={[styles.emptyText, { color: textSecondaryColor }]}>Importez un fichier JSON pour commencer.</AppText>
        )}
      </View>
    );
  }, [appState.clients.length, clientFilters.filteredClientsCount, appState.palette.textSecondary]);




  const handleSelectDatabase = useCallback((dbName: DatabaseName) => {
    if (dbName === appState.activeDatabase) {
      return;
    }
    clientData.setLoading(true);
    appState.setClients([]);
    appState.setActiveDatabase(dbName);
  }, [appState, clientData]);

  const renderClient = useCallback(({ item }: { item: ClientWithRelations }) => (
    <ClientCard
      client={item}
      palette={appState.palette}
      onToggleStatus={clientActions.handleToggleStatus}
      onEdit={clientActions.handleEditClient}
      onDelete={clientActions.handleDeleteClient}
      activeDatabase={appState.activeDatabase}
      onArchive={clientActions.handleArchiveClient}
      onUnarchive={clientActions.handleUnarchiveClient}
    />
  ), [appState.activeDatabase, clientActions, appState.palette]);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={appState.isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <SafeAreaView style={[styles.container, { backgroundColor: appState.palette.background }]}>
        <View style={styles.glow} />

        <AppControls
          activeDatabase={appState.activeDatabase}
          mainReady={mainDbReady}
          archiveReady={archiveDbReady}
          onSelectDatabase={handleSelectDatabase}
          searchQuery={clientFilters.searchQuery}
          onChangeSearchQuery={clientFilters.setSearchQuery}
          statusFilter={clientFilters.statusFilter}
          onChangeStatusFilter={clientFilters.setStatusFilter}
          statusCounts={clientFilters.statusCounts}
          isSortAscending={clientFilters.isSortAscending}
          onToggleSort={() => clientFilters.setIsSortAscending(!clientFilters.isSortAscending)}
          onExport={clientData.triggerExport}
          onImport={clientData.triggerImport}
          isExporting={clientData.isExporting}
          isImporting={clientData.isImporting}
          clientsCount={appState.clients.length}
          isDark={appState.manualDarkMode}
          systemIsDark={false}
          onToggleTheme={appState.handleToggleTheme}
          palette={appState.palette}
        />

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
          palette={appState.palette}
          accessibilityLabel="Ajouter une cliente"
        />
      </SafeAreaView>
      <ClientFormModal
        visible={appState.formVisible}
        palette={appState.palette}
        initialValues={appState.formInitialValues}
        onClose={clientActions.handleCloseForm}
        onSubmit={clientActions.handleSubmitClientForm}
        submitting={appState.formSubmitting}
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
