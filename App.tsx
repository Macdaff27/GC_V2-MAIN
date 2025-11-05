// Importations React et hooks nécessaires
import React, {
  useCallback,
  useEffect,
  useMemo,
} from 'react';
// Importations des composants React Native pour l'interface utilisateur
import {
  Alert,
  FlatList,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
// Importations des composants personnalisés de l'application
import AppText from './AppText';
import ClientFormModal from './src/components/ClientFormModal';
import ClientCard from './src/components/ClientCard';
import AppControls from './src/components/AppControls';
import FloatingActionButton from './src/components/FloatingActionButton';
// Importations pour gérer les zones sûres de l'écran (notch, etc.)
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
// Importations des hooks personnalisés pour la logique métier
import { useDatabase } from './src/hooks/useDatabase';
import { useClientActions } from './src/hooks/useClientActions';
import { useClientFilters } from './src/hooks/useClientFilters';
import { useClientData } from './src/hooks/useClientData';
import { useSmartScroll } from './src/hooks/useSmartScroll';
import { useAppState } from './src/hooks/useAppState';

// Importations des types TypeScript
import type {
  ClientWithRelations,
  DatabaseName,
} from './src/types';

/**
 * Composant principal de l'application React Native
 * Gère l'affichage et la logique d'une application de gestion de clients
 * avec support pour deux bases de données (principale et archive)
 */
function App(): React.JSX.Element {
  // Hook pour gérer l'état global de l'application (thème, base active, etc.)
  const appState = useAppState();

  // Initialisation des hooks de base de données pour les deux bases
  const mainDb = useDatabase({ databaseName: 'main' });
  const archiveDb = useDatabase({ databaseName: 'archive' });
  // Sélection de la base active selon l'état de l'application
  const activeDb = appState.activeDatabase === 'main' ? mainDb : archiveDb;

  // Extraction des méthodes et états de la base active
  const {
    loadClients: loadDbClients,
    createClient: createDbClient,
    clearAllData: clearDbAllData,
    isReady,
    error: dbError,
  } = activeDb;
  // États de préparation des bases pour l'interface
  const mainDbReady = mainDb.isReady;
  const archiveDbReady = archiveDb.isReady;



  // Hook pour gérer les filtres et recherches sur les clients
  const clientFilters = useClientFilters({ clients: appState.clients });

  // Hook pour gérer le défilement intelligent (restauration de position après actions)
  const smartScroll = useSmartScroll({
    clients: appState.clients,
    filteredClients: clientFilters.filteredClients,
    searchFilteredClients: clientFilters.searchFilteredClients,
    searchQuery: clientFilters.searchQuery,
    statusFilter: clientFilters.statusFilter,
    setSearchQuery: clientFilters.setSearchQuery,
    setStatusFilter: clientFilters.setStatusFilter,
  });

  // Hook pour gérer les opérations de données des clients (import/export)
  const clientData = useClientData({
    clients: appState.clients,
    isReady,
    createClient: createDbClient,
    clearAllData: clearDbAllData,
    onLoadClients: () => Promise.resolve(), // Placeholder, sera mis à jour plus tard
  });

  /**
   * Fonction pour charger les clients depuis la base de données active
   * Gère les états de chargement et les erreurs
   */
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

  // Hook pour gérer les actions sur les clients (création, édition, suppression, archivage)
  const clientActions = useClientActions({
    activeDatabase: appState.activeDatabase,
    onLoadClients: loadClients,
    onSetFormVisible: appState.setFormVisible,
    onSetFormInitialValues: appState.setFormInitialValues,
    onSetFormSubmitting: appState.setFormSubmitting,
    onSetPendingScrollClientId: smartScroll.setPendingScrollClientId,
    onSetShouldRestoreScroll: smartScroll.setShouldRestoreScroll,
  });

  /**
   * Effet pour initialiser l'application au montage
   * Gère les erreurs de base de données et charge les clients
   */
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



  /**
   * Composant mémorisé pour afficher le message quand la liste est vide
   * Affiche un message différent selon qu'il y a des clients filtrés ou non
   */
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

  /**
   * Gestionnaire pour changer de base de données
   * Réinitialise les clients et met à jour la base active
   */
  const handleSelectDatabase = useCallback((dbName: DatabaseName) => {
    if (dbName === appState.activeDatabase) {
      return;
    }
    clientData.setLoading(true);
    appState.setClients([]);
    appState.setActiveDatabase(dbName);
  }, [appState, clientData]);

  /**
   * Fonction de rendu pour chaque élément de la FlatList
   * Retourne un composant ClientCard avec les props appropriées
   */
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

  // Structure JSX de rendu de l'application
  return (
    // Fournisseur pour gérer les zones sûres de l'écran
    <SafeAreaProvider>
      {/* Configuration de la barre de statut selon le thème */}
      <StatusBar
        barStyle={appState.isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      {/* Conteneur principal avec fond dynamique */}
      <SafeAreaView style={[styles.container, { backgroundColor: appState.palette.background }]}>
        {/* Effet visuel de lueur en arrière-plan */}
        <View style={styles.glow} />

        {/* Composant de contrôles principaux (recherche, filtres, thème, etc.) */}
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
          systemIsDark={appState.isDarkMode}
          onToggleTheme={appState.handleToggleTheme}
          palette={appState.palette}
        />

        {/* Liste déroulante des clients avec défilement intelligent */}
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

        {/* Bouton flottant pour ajouter un nouveau client */}
        <FloatingActionButton
          onPress={clientActions.handleCreateClient}
          palette={appState.palette}
          accessibilityLabel="Ajouter une cliente"
        />
      </SafeAreaView>
      {/* Modal pour créer/éditer un client */}
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

// Styles de l'application utilisant StyleSheet de React Native
const styles = StyleSheet.create({
  // Conteneur principal de l'écran
  container: {
    flex: 1, // Prend tout l'espace disponible
    position: 'relative', // Positionnement relatif pour les éléments enfants absolus
    paddingHorizontal: 24, // Marge horizontale
    paddingTop: 16, // Marge supérieure
  },
  // Effet de lueur décoratif en arrière-plan
  glow: {
    position: 'absolute', // Position absolue
    top: -120, // Positionnée au-dessus du conteneur
    right: -80, // Décalée à droite
    width: 240, // Largeur du cercle
    height: 240, // Hauteur du cercle
    borderRadius: 120, // Cercle parfait
    backgroundColor: 'rgba(56, 189, 248, 0.18)', // Couleur bleue semi-transparente
    transform: [{ rotate: '25deg' }], // Rotation de 25 degrés
  },
  // Styles pour le contenu de la liste
  listContent: {
    paddingBottom: 48, // Espace en bas pour le bouton flottant
    gap: 16, // Espace entre les éléments
  },
  // Conteneur quand la liste est vide (centrage vertical)
  listEmptyContainer: {
    flexGrow: 1, // Prend tout l'espace disponible
    justifyContent: 'center', // Centre verticalement
  },
  // Conteneur du message vide
  listEmpty: {
    alignItems: 'center', // Centre horizontalement
    gap: 12, // Espace entre les éléments
  },
  // Style du texte quand la liste est vide
  emptyText: {
    fontSize: 15, // Taille de police
    textAlign: 'center', // Alignement centré
  },
});

export default App;
