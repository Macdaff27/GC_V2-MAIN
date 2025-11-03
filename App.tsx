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
import ClientFormModal, {
  createEmptyFormValues,
  createFormValuesFromClient,
} from './src/components/ClientFormModal';
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
  formatDateForStorage,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in-progress' | 'done'>('all');
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [formInitialValues, setFormInitialValues] = useState<ClientFormValues | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [isSortAscending, setIsSortAscending] = useState(true);
  const [activeDatabase, setActiveDatabase] = useState<DatabaseName>('main');

  const mainDb = useDatabase({ databaseName: 'main' });
  const archiveDb = useDatabase({ databaseName: 'archive' });
  const activeDb = activeDatabase === 'main' ? mainDb : archiveDb;

  const {
    loadClients: loadDbClients,
    createClient: createDbClient,
    updateClient: updateDbClient,
    deleteClient: deleteDbClient,
    toggleClientStatus: toggleDbClientStatus,
    clearAllData: clearDbAllData,
    isReady,
    error: dbError,
  } = activeDb;
  const mainDbReady = mainDb.isReady;
  const archiveDbReady = archiveDb.isReady;
  const archiveFromMain = mainDb.archiveClient;
  const unarchiveFromArchive = archiveDb.unarchiveClient;

  const listRef = useRef<FlatList<ClientWithRelations> | null>(null);
  const pendingScrollClientIdRef = useRef<number | null>(null);
  const lastScrollOffsetRef = useRef(0);
  const shouldRestoreScrollRef = useRef(false);
  const deletingRef = useRef(false);

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

  const searchFilteredClients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return clients;
    }

    return clients.filter((client) => {
      const note = client.note?.toLowerCase();
      return (
        client.nom.toLowerCase().includes(query) ||
        client.page.toString().includes(query) ||
        (note ? note.includes(query) : false)
      );
    });
  }, [clients, searchQuery]);

  const statusCounts = useMemo(() => {
    let inProgress = 0;
    let done = 0;

    for (const client of searchFilteredClients) {
      if (client.statut) {
        done += 1;
      } else {
        inProgress += 1;
      }
    }

    return {
      total: searchFilteredClients.length,
      inProgress,
      done,
    };
  }, [searchFilteredClients]);

  const filteredClients = useMemo(() => {
    const baseList =
      statusFilter === 'all'
        ? searchFilteredClients
        : searchFilteredClients.filter((client) =>
            statusFilter === 'done' ? client.statut : !client.statut,
          );

    const sortedList = [...baseList].sort((a, b) => {
      if (isSortAscending) {
        return a.page - b.page;
      }
      return b.page - a.page;
    });

    return sortedList;
  }, [isSortAscending, searchFilteredClients, statusFilter]);

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

    if (searchQuery.trim().length > 0) {
      console.log('[SEARCH]', `Scroll differe annule pendant la recherche (id=${targetId}).`);
      pendingScrollClientIdRef.current = null;
      return;
    }

    const indexInFiltered = filteredClients.findIndex((client) => client.id === targetId);
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

    const indexInSearchFiltered = searchFilteredClients.findIndex((client) => client.id === targetId);
    if (indexInSearchFiltered !== -1 && statusFilter !== 'all') {
      setStatusFilter('all');
      return;
    }

    const indexInAllClients = clients.findIndex((client) => client.id === targetId);
    if (indexInAllClients !== -1) {
      let didAdjust = false;
      if (searchQuery !== '') {
        setSearchQuery('');
        didAdjust = true;
      }
      if (statusFilter !== 'all') {
        setStatusFilter('all');
        didAdjust = true;
      }
      if (didAdjust) {
        return;
      }
    }

    pendingScrollClientIdRef.current = null;
  }, [clients, filteredClients, searchFilteredClients, searchQuery, setSearchQuery, setStatusFilter, statusFilter]);

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      return;
    }
    if (pendingScrollClientIdRef.current === null) {
      return;
    }
    // On neutralise les scrolls differes des qu'une recherche demarre pour eviter les crashs lies aux datasets mouvants.
    console.log('[SEARCH]', 'Scroll differe abandonne car une recherche est active.');
    pendingScrollClientIdRef.current = null;
  }, [searchQuery]);

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
  }, [filteredClients]);

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

  const handleToggleStatus = useCallback(async (client: ClientWithRelations) => {
    if (!isReady) {
      Alert.alert('Erreur', "La base de donn\u00E9es n'est pas pr\u00EAte.");
      return;
    }

    try {
      await toggleDbClientStatus(client.id, !client.statut);
      await loadClients();
      const message = client.statut ? 'Commande marquee en cours.' : 'Commande marquee terminee.';
      Alert.alert('Succes', message);
    } catch (error) {
      console.error('Erreur lors du changement de statut', error);
      Alert.alert('Erreur', "Impossible de mettre \u00E0 jour le statut.");
    }
  }, [isReady, loadClients, toggleDbClientStatus]);

  const handleDeleteClient = useCallback((client: ClientWithRelations) => {
    if (!isReady) {
      Alert.alert('Erreur', "La base de donn\u00E9es n'est pas pr\u00EAte.");
      return;
    }

    Alert.alert(
      'Supprimer',
      `Supprimer ${client.nom} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            if (deletingRef.current) {
              return;
            }
            deletingRef.current = true;
            shouldRestoreScrollRef.current = true;
            console.log('[LIST]', `Suppression ${client.id} (offset courant ${lastScrollOffsetRef.current}).`);

            const removeClient = async () => {
              try {
                await deleteDbClient(client.id);
                await loadClients();
                Alert.alert('Succes', 'Client supprime.');
              } catch (error) {
                console.error('Erreur lors de la suppression', error);
                Alert.alert('Erreur', 'Impossible de supprimer ce client.');
              } finally {
                deletingRef.current = false;
              }
            };
            removeClient();
          },
        },
      ],
    );
  }, [deleteDbClient, isReady, loadClients]);

  const handleArchiveClient = useCallback((client: ClientWithRelations) => {
    if (!mainDbReady) {
      Alert.alert('Erreur', "La base de donn\u00E9es principale n'est pas pr\u00EAte.");
      return;
    }

    Alert.alert(
      'Archiver',
      `Archiver ${client.nom} ?\nLa cliente sera d\u00E9plac\u00E9e vers les archives.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Archiver',
          style: 'default',
          onPress: async () => {
            try {
              await archiveFromMain(client.id, client);
              await loadClients();
            } catch (error) {
              console.error('Erreur archivage', error);
            }
          },
        },
      ],
    );
  }, [archiveFromMain, loadClients, mainDbReady]);

  const handleUnarchiveClient = useCallback((client: ClientWithRelations) => {
    if (!archiveDbReady) {
      Alert.alert('Erreur', "La base de donn\u00E9es archive n'est pas pr\u00EAte.");
      return;
    }

    Alert.alert(
      'D\u00E9sarchiver',
      `D\u00E9sarchiver ${client.nom} ?\nLa cliente sera d\u00E9plac\u00E9e vers les clientes actives.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'D\u00E9sarchiver',
          style: 'default',
          onPress: async () => {
            try {
              await unarchiveFromArchive(client.id, client);
              await loadClients();
            } catch (error) {
              console.error('Erreur d\u00E9sarchivage', error);
            }
          },
        },
      ],
    );
  }, [archiveDbReady, loadClients, unarchiveFromArchive]);

  const handleSelectDatabase = useCallback((dbName: DatabaseName) => {
    if (dbName === activeDatabase) {
      return;
    }
    setLoading(true);
    setClients([]);
    setActiveDatabase(dbName);
  }, [activeDatabase]);

  const handleCreateClient = useCallback(() => {
    // On force la restauration pour conserver exactement la meme fenetre apres validation du formulaire.
    shouldRestoreScrollRef.current = true;
    console.log('[LIST]', `Formulaire d'ajout ouvert (offset ${lastScrollOffsetRef.current}).`);
    setFormInitialValues(createEmptyFormValues());
    setFormVisible(true);
  }, []);

  const handleEditClient = useCallback((client: ClientWithRelations) => {
    setFormInitialValues(createFormValuesFromClient(client));
    setFormVisible(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setFormVisible(false);
    setFormInitialValues(null);
  }, []);

  const handleSubmitClientForm = useCallback(async (values: ClientFormValues) => {
    if (!isReady) {
      Alert.alert('Erreur', "La base de donn\u00E9es n'est pas pr\u00EAte.");
      return;
    }

    if (!values.nom.trim()) {
      Alert.alert('Validation', 'Le nom est obligatoire.');
      return;
    }

    const pageNumber = Number(values.page);
    if (!Number.isFinite(pageNumber)) {
      Alert.alert('Validation', 'La page doit etre un nombre.');
      return;
    }

    const montantTotalRaw = Number(values.montantTotal);
    const montantRestantRaw = Number(values.montantRestant);
    const montantTotal = Number.isFinite(montantTotalRaw) ? montantTotalRaw : 0;
    const montantRestant = Number.isFinite(montantRestantRaw) ? montantRestantRaw : 0;
    const dateAjout = formatDateForStorage(values.dateAjout.trim());
    const note = values.note.trim();
    const statut = values.statut;

    const feeEntries = values.frais
      .map((fee) => ({
        type: fee.type.trim(),
        montant: Number(fee.montant),
      }))
      .map((fee) => ({
        type: fee.type,
        montant: Number.isFinite(fee.montant) ? fee.montant : 0,
      }))
      .filter((fee) => fee.type.length > 0);

    const phoneEntries = values.telephones
      .map((phone) => phone.numero.trim())
      .filter((numero) => numero.length > 0);

    setFormSubmitting(true);

    try {
      let clientId = values.id ?? null;
      const payload = {
        nom: values.nom.trim(),
        page: pageNumber,
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
      };

      if (clientId) {
        await updateDbClient(clientId, payload);
      } else {
        clientId = await createDbClient(payload);
      }

      if (clientId !== null && values.id) {
        pendingScrollClientIdRef.current = clientId;
      } else {
        // On desactive le recentrage automatique apres une creation pour rester exactement au meme endroit.
        pendingScrollClientIdRef.current = null;
      }

      await loadClients();
      setFormVisible(false);
      setFormInitialValues(null);
      Alert.alert('Succes', values.id ? 'Cliente mise a jour.' : 'Cliente ajoutee.');
    } catch (error) {
      pendingScrollClientIdRef.current = null;
      console.error('Erreur enregistrement cliente', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder cette cliente.');
    } finally {
      setFormSubmitting(false);
    }
  }, [createDbClient, isReady, loadClients, updateDbClient]);

const renderClient = useCallback(({ item }: { item: ClientWithRelations }) => (
    <ClientCard
      client={item}
      palette={palette}
      onToggleStatus={handleToggleStatus}
      onEdit={handleEditClient}
      onDelete={handleDeleteClient}
      activeDatabase={activeDatabase}
      onArchive={handleArchiveClient}
      onUnarchive={handleUnarchiveClient}
    />
  ), [activeDatabase, handleArchiveClient, handleDeleteClient, handleEditClient, handleToggleStatus, handleUnarchiveClient, palette]);

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
            value={searchQuery}
            onChangeText={setSearchQuery}
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
            statusFilter={statusFilter}
            onFilterChange={setStatusFilter}
            counts={statusCounts}
            palette={palette}
          />

          <ThemeToggle
            isDark={manualDarkMode ?? systemIsDark}
            onToggle={(value: boolean) => setManualDarkMode(value ? true : value === false ? false : null)}
            palette={palette}
          />

          <SortButton
            isAscending={isSortAscending}
            onToggle={() => setIsSortAscending((prev) => !prev)}
            palette={palette}
          />
        </View>

        <FlatList
          ref={listRef}
          data={filteredClients}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderClient}
          removeClippedSubviews={false}
          contentContainerStyle={[
            styles.listContent,
            filteredClients.length === 0 ? styles.listEmptyContainer : null,
          ]}
          ListEmptyComponent={listEmptyComponent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onScrollToIndexFailed={(_info) => {
            if (searchQuery.trim().length > 0) {
              console.log('[SCROLL]', 'onScrollToIndexFailed ignore : recherche active.');
              pendingScrollClientIdRef.current = null;
              return;
            }

            const targetId = pendingScrollClientIdRef.current;
            if (!targetId) {
              return;
            }

            const fallbackIndex = filteredClients.findIndex((client) => client.id === targetId);
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
          onPress={handleCreateClient}
          palette={palette}
          accessibilityLabel="Ajouter une cliente"
        />
      </SafeAreaView>
      <ClientFormModal
        visible={formVisible}
        palette={palette}
        initialValues={formInitialValues}
        onClose={handleCloseForm}
        onSubmit={handleSubmitClientForm}
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


