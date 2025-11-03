import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
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
import { errorCodes as documentPickerErrorCodes, isErrorWithCode as isDocumentPickerError, keepLocalCopy, pick, types as documentPickerTypes } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
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

import type {
  Palette,
  ClientWithRelations,
  DatabaseName,
  JsonImportShape,
  ClientFormValues,
} from './src/types';

import {
  normalizeParsedInput,
  formatDate,
  normalizeAmount,
  normalizeStatus,
  normalizeString,
  buildExportFileName,
} from './src/utils/format';

function App(): React.JSX.Element {
  const systemIsDark = useColorScheme() === 'dark'; 
  const [manualDarkMode, setManualDarkMode] = useState<boolean | null>(null);
  const isDarkMode = manualDarkMode ?? systemIsDark;
  const [clients, setClients] = useState<ClientWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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

  const listRef = useRef<FlatList<ClientWithRelations> | null>(null);
  const pendingScrollClientIdRef = useRef<number | null>(null);
  const lastScrollOffsetRef = useRef(0);
  const shouldRestoreScrollRef = useRef(false);

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

  const loadClients = useCallback(async () => {
    if (!isReady) {
      return;
    }

    setLoading(true);
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
      setLoading(false);
    }
  }, [isReady, loadDbClients]);

  // Client actions hook
  const clientActions = useClientActions({
    activeDatabase,
    onLoadClients: loadClients,
    onSetFormVisible: setFormVisible,
    onSetFormInitialValues: setFormInitialValues,
    onSetFormSubmitting: setFormSubmitting,
    onSetPendingScrollClientId: (id) => { pendingScrollClientIdRef.current = id; },
    onSetShouldRestoreScroll: (restore) => { shouldRestoreScrollRef.current = restore; },
  });

  // Client filters hook
  const clientFilters = useClientFilters({ clients });

  useEffect(() => {
    if (dbError) {
      console.error("Erreur d'initialisation SQLite", dbError);
      Alert.alert('Erreur', "Impossible d'initialiser la base de donn\u00E9es.");
      setClients([]);
      setLoading(false);
      return;
    }

    loadClients().catch(() => {});
  }, [dbError, loadClients]);



  useEffect(() => {
    const targetId = pendingScrollClientIdRef.current;
    if (!targetId) {
      return;
    }

    // On annule les scrolls differes si une restauration d'offset ou une recherche est en cours pour eviter les courses.
    if (shouldRestoreScrollRef.current) {
      console.log('[SCROLL]', 'Scroll differe annule : restauration prioritaire.');
      pendingScrollClientIdRef.current = null;
      return;
    }

    if (clientFilters.searchQuery.trim().length > 0) {
      console.log('[SEARCH]', `Scroll differe annule pendant la recherche (id=${targetId}).`);
      pendingScrollClientIdRef.current = null;
      return;
    }

    const indexInFiltered = clientFilters.filteredClients.findIndex((client) => client.id === targetId);
    if (indexInFiltered !== -1) {
      requestAnimationFrame(() => {
        if (!listRef.current) {
          pendingScrollClientIdRef.current = null;
          return;
        }
        try {
          listRef.current.scrollToIndex({
            index: indexInFiltered,
            animated: true,
            viewPosition: 0.1,
          });
          console.log('[SCROLL]', `scrollToIndex reussi pour ${targetId} (index ${indexInFiltered}).`);
        } catch (error) {
          console.log('[SCROLL]', `scrollToIndex echoue pour ${targetId}.`, error);
        } finally {
          pendingScrollClientIdRef.current = null;
        }
      });
      return;
    }

    const indexInSearchFiltered = clientFilters.searchFilteredClients.findIndex((client) => client.id === targetId);
    if (indexInSearchFiltered !== -1 && clientFilters.statusFilter !== 'all') {
      clientFilters.setStatusFilter('all');
      return;
    }

    const indexInAllClients = clients.findIndex((client) => client.id === targetId);
    if (indexInAllClients !== -1) {
      let didAdjust = false;
      if (clientFilters.searchQuery !== '') {
        clientFilters.setSearchQuery('');
        didAdjust = true;
      }
      if (clientFilters.statusFilter !== 'all') {
        clientFilters.setStatusFilter('all');
        didAdjust = true;
      }
      if (didAdjust) {
        return;
      }
    }

    pendingScrollClientIdRef.current = null;
  }, [clients, clientFilters]);

  useEffect(() => {
    if (clientFilters.searchQuery.trim().length === 0) {
      return;
    }
    if (pendingScrollClientIdRef.current === null) {
      return;
    }
    // On neutralise les scrolls differes des qu'une recherche demarre pour eviter les crashs lies aux datasets mouvants.
    console.log('[SEARCH]', 'Scroll differe abandonne car une recherche est active.');
    pendingScrollClientIdRef.current = null;
  }, [clientFilters.searchQuery]);

  useEffect(() => {
    if (!shouldRestoreScrollRef.current) {
      return;
    }

    const targetOffset = lastScrollOffsetRef.current;
    requestAnimationFrame(() => {
      // On restaure sans animation pour ne pas provoquer de mouvement perceptible apres ajout/suppression.
      try {
        listRef.current?.scrollToOffset({ offset: targetOffset, animated: false });
        console.log('[SCROLL]', `Offset restaure a ${targetOffset}.`);
      } catch (error) {
        console.log('[SCROLL]', 'Restauration offset impossible pour le moment.', error);
      } finally {
        shouldRestoreScrollRef.current = false;
      }
    });
  }, [clientFilters.filteredClients]);

  const listEmptyComponent = useMemo(() => (
    <View style={styles.listEmpty}>
      {loading ? (
        <>
          <ActivityIndicator color={palette.accent} />
          <AppText style={[styles.emptyText, { color: palette.textSecondary }]}>Chargement...</AppText>
        </>
      ) : (
        <AppText style={[styles.emptyText, { color: palette.textSecondary }]}>Importez un fichier JSON pour commencer.</AppText>
      )}
    </View>
  ), [loading, palette]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // On memorise l'offset du scroll pour pouvoir restaurer exactement la meme zone visible apres une mutation.
    lastScrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);


  const handleExportPress = useCallback(async () => {
    if (isExporting) {
      return;
    }

    if (clients.length === 0) {
      Alert.alert('Aucune donn\u00E9e', "Il n'y a aucune cliente \u00E0 exporter pour le moment.");
      return;
    }

    try {
      setIsExporting(true);
      const exportDirectory =
        Platform.OS === 'android' && RNFS.DownloadDirectoryPath
          ? RNFS.DownloadDirectoryPath
          : RNFS.DocumentDirectoryPath;
      const filePath = `${exportDirectory}/${buildExportFileName()}`;

      const payload = {
        exportedAt: new Date().toISOString(),
        total: clients.length,
        clients: clients.map((client) => ({
          nom: client.nom,
          page: client.page,
          note: client.note,
          montantTotal: client.montantTotal,
          montantRestant: client.montantRestant,
          dateAjout: client.dateAjout,
          statut: client.statut,
          telephones: client.telephones.map((phone) => phone.numero),
          frais: client.frais.map((fee) => ({
            type: fee.type,
            montant: fee.montant,
          })),
        })),
      };

      await RNFS.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');

      Alert.alert('Export termin\u00E9', `Fichier enregistr\u00E9 :
${filePath}`);
    } catch (error) {
      console.error("Erreur lors de l'export JSON", error);
      Alert.alert('Erreur', "Impossible d'exporter les donn\u00E9es en JSON.");
    } finally {
      setIsExporting(false);
    }
  }, [clients, isExporting]);

  const handleImportPress = useCallback(async () => {
    if (!isReady) {
      Alert.alert('Erreur', "La base de donn\u00E9es n'est pas pr\u00EAte.");
      return;
    }

    if (isImporting) {
      return;
    }

    try {
      setIsImporting(true);

      const [pickedFile] = await pick({
        type: [documentPickerTypes.json, documentPickerTypes.plainText, documentPickerTypes.allFiles],
        allowMultiSelection: false,
        mode: 'import',
      });

      const targetName = pickedFile?.name ?? `import-${Date.now()}.json`;

      const [copyResult] = await keepLocalCopy({
        files: [
          {
            uri: pickedFile.uri,
            fileName: targetName,
          },
        ],
        destination: 'cachesDirectory',
      });

      if (copyResult.status !== 'success') {
        throw new Error(copyResult.copyError ?? 'Echec de la copie du fichier');
      }

      const fileUri = copyResult.localUri;
      const normalizedPath = fileUri.startsWith('file://')
        ? fileUri.replace('file://', '')
        : fileUri;
      const fileContent = await RNFS.readFile(normalizedPath, 'utf8');

      let parsed: JsonImportShape;
      try {
        parsed = JSON.parse(fileContent) as JsonImportShape;
      } catch (parseError) {
        Alert.alert('Erreur', 'Le fichier s\u00E9lectionn\u00E9 ne contient pas un JSON valide.');
        return;
      }

      const normalizedClients = normalizeParsedInput(parsed);

      if (normalizedClients.length === 0) {
        Alert.alert('Import termin\u00E9', 'Aucune cliente valide d\u00E9tect\u00E9e dans le fichier.');
        return;
      }

      // Demande une confirmation explicite avant de purger les tables locales.
      const userConfirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Confirmation',
          'Cette action va supprimer toutes les clientes existantes et les remplacer par celles du fichier JSON. Continuer ?',
          [
            { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Confirmer', style: 'destructive', onPress: () => resolve(true) },
          ],
          {
            cancelable: true,
            onDismiss: () => resolve(false),
          },
        );
      });

      if (!userConfirmed) {
        return;
      }

      // Vide les tables pour repartir sur le contenu du fichier import\u00E9.
      await clearDbAllData();

      let importedCount = 0;
      let skippedCount = 0;

      for (const rawClient of normalizedClients) {
        const nom = normalizeString(rawClient.nom).trim();
        const page = Number(rawClient.page);

        if (!nom || Number.isNaN(page)) {
          skippedCount += 1;
          continue;
        }

        const montantTotal = normalizeAmount(rawClient.montantTotal);
        const montantRestant = normalizeAmount(rawClient.montantRestant);
        const note = normalizeString(rawClient.note).trim();
        const statut = normalizeStatus(rawClient.statut);
        // Utilise la date fournie dans le JSON (JJ/MM/AAAA) ou la date du jour si absente.
        const dateAjout = rawClient.dateAjout || formatDate(new Date());

        const phoneEntries = Array.isArray(rawClient.telephones)
          ? rawClient.telephones
              .map((value) => (typeof value === 'string' ? value.trim() : ''))
              .filter((value): value is string => value.length > 0)
          : [];

        const feeEntries = Array.isArray(rawClient.frais)
          ? rawClient.frais
              .map((fee) => ({
                type: normalizeString(fee?.type).trim(),
                montant: normalizeAmount(fee?.montant),
              }))
              .filter((fee) => fee.type.length > 0)
          : [];

        try {
          await createDbClient({
            nom,
            page,
            note,
            montantTotal,
            montantRestant,
            dateAjout,
            statut,
            frais: feeEntries.map((fee) => ({
              type: fee.type,
              montant: fee.montant,
            })),
            telephones: phoneEntries.map((numero) => ({ numero })),
          });
          importedCount += 1;
        } catch (clientError) {
          console.error("Erreur d'import pour la cliente", clientError);
          skippedCount += 1;
        }
      }

      await loadClients();

      const messages: string[] = [];
      if (importedCount > 0) {
        messages.push(`${importedCount} cliente(s) ajout\u00E9e(s).`);
      }
      if (skippedCount > 0) {
        messages.push(`${skippedCount} enregistrement(s) ignor\u00E9(s).`);
      }
      if (messages.length === 0) {
        messages.push('Aucune modification appliqu\u00E9e.');
      }

      Alert.alert('Import termin\u00E9', messages.join('\n'));
    } catch (error) {
      if (isDocumentPickerError(error) && error.code === documentPickerErrorCodes.OPERATION_CANCELED) {
        return;
      }
      console.error("Erreur lors de l'import JSON", error);
      Alert.alert('Erreur', "Impossible d'importer ce fichier JSON.");
    } finally {
      setIsImporting(false);
    }
  }, [isReady, isImporting, clearDbAllData, createDbClient, loadClients]);

  const triggerExport = useCallback(() => {
    handleExportPress().catch(() => {});
  }, [handleExportPress]);

  const triggerImport = useCallback(() => {
    handleImportPress().catch(() => {});
  }, [handleImportPress]);

  const handleSelectDatabase = useCallback((dbName: DatabaseName) => {
    if (dbName === activeDatabase) {
      return;
    }
    setLoading(true);
    setClients([]);
    setActiveDatabase(dbName);
  }, [activeDatabase]);

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
            onExport={triggerExport}
            onImport={triggerImport}
            isExporting={isExporting}
            isImporting={isImporting}
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
          ref={listRef}
          data={clientFilters.filteredClients}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderClient}
          removeClippedSubviews={false}
          contentContainerStyle={[
            styles.listContent,
            clientFilters.filteredClients.length === 0 ? styles.listEmptyContainer : null,
          ]}
          ListEmptyComponent={listEmptyComponent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onScrollToIndexFailed={(_info) => {
            if (clientFilters.searchQuery.trim().length > 0) {
              console.log('[SCROLL]', 'onScrollToIndexFailed ignore : recherche active.');
              pendingScrollClientIdRef.current = null;
              return;
            }

            const targetId = pendingScrollClientIdRef.current;
            if (!targetId) {
              return;
            }

            const fallbackIndex = clientFilters.filteredClients.findIndex((client) => client.id === targetId);
            if (fallbackIndex === -1) {
              pendingScrollClientIdRef.current = null;
              return;
            }

            requestAnimationFrame(() => {
              if (!listRef.current) {
                pendingScrollClientIdRef.current = null;
                return;
              }

              try {
                listRef.current.scrollToIndex({
                  index: fallbackIndex,
                  animated: true,
                  viewPosition: 0.1,
                });
                console.log('[SCROLL]', `Retry scrollToIndex reussi pour ${targetId} apres echec initial.`);
              } catch (error) {
                console.log('[SCROLL]', 'Retry scrollToIndex impossible.', error);
              } finally {
                pendingScrollClientIdRef.current = null;
              }
            });
          }}
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
