/**
 * Importations React et dépendances pour useClientData
 */
import { useCallback, useState } from 'react';
// Importations des composants React Native
import { Alert, Platform } from 'react-native';
// Importation du sélecteur de documents pour l'import/export
import { errorCodes as documentPickerErrorCodes, isErrorWithCode as isDocumentPickerError, keepLocalCopy, pick, types as documentPickerTypes } from '@react-native-documents/picker';
// Importation du système de fichiers React Native
import RNFS from 'react-native-fs';
// Importations des types TypeScript
import type { ClientWithRelations, JsonImportShape } from '../types';
// Importations des utilitaires de formatage et normalisation
import {
  normalizeParsedInput,
  formatDate,
  normalizeAmount,
  normalizeStatus,
  normalizeString,
  buildExportFileName,
} from '../utils/format';

/**
 * Interface définissant les paramètres du hook useClientData
 * Ce hook gère l'import/export des données clients
 */
export interface UseClientDataParams {
  clients: ClientWithRelations[]; // Liste des clients à exporter
  isReady: boolean; // État de préparation de la base de données
  createClient: (payload: any) => Promise<number>; // Fonction de création d'un client
  clearAllData: () => Promise<void>; // Fonction de vidage des données
  onLoadClients: () => Promise<void>; // Fonction de rechargement des clients
}

/**
 * Interface définissant le retour du hook useClientData
 * Fournit les états et fonctions pour l'import/export
 */
export interface UseClientDataReturn {
  // États du hook
  loading: boolean; // État de chargement général
  isImporting: boolean; // État d'import en cours
  isExporting: boolean; // État d'export en cours

  // Gestionnaires d'événements
  setLoading: (loading: boolean) => void; // Contrôle l'état de chargement
  handleExportPress: () => Promise<void>; // Gestionnaire d'export direct
  handleImportPress: () => Promise<void>; // Gestionnaire d'import direct
  triggerExport: () => void; // Déclencheur d'export (avec gestion d'erreur)
  triggerImport: () => void; // Déclencheur d'import (avec gestion d'erreur)
}

/**
 * Hook personnalisé useClientData - Gestion de l'import/export des données clients
 * Fournit les fonctionnalités d'export JSON et d'import avec validation et normalisation
 * Gère les états de chargement et les interactions avec le système de fichiers
 */
export const useClientData = ({
  clients,
  isReady,
  createClient,
  clearAllData,
  onLoadClients,
}: UseClientDataParams): UseClientDataReturn => {
  // États locaux pour gérer les opérations d'import/export
  const [loading, setLoading] = useState(true); // État de chargement général
  const [isImporting, setIsImporting] = useState(false); // Flag d'import en cours
  const [isExporting, setIsExporting] = useState(false); // Flag d'export en cours

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

      Alert.alert('Export termin\u00E9', `Fichier enregistr\u00E9 :\n${filePath}`);
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
      await clearAllData();

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
          await createClient({
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

      await onLoadClients();

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
  }, [isReady, isImporting, clearAllData, createClient, onLoadClients]);

  const triggerExport = useCallback(() => {
    handleExportPress().catch(() => {});
  }, [handleExportPress]);

  const triggerImport = useCallback(() => {
    handleImportPress().catch(() => {});
  }, [handleImportPress]);

  // Retour du hook avec tous les états et fonctions d'import/export
  return {
    // États du hook (pour monitoring et UI)
    loading, // État de chargement général
    isImporting, // True pendant l'import
    isExporting, // True pendant l'export

    // Gestionnaires d'événements principaux
    setLoading, // Contrôle manuel de l'état loading
    handleExportPress, // Export direct (avec gestion d'erreur)
    handleImportPress, // Import direct (avec gestion d'erreur)
    triggerExport, // Déclencheur d'export (sans gestion d'erreur)
    triggerImport, // Déclencheur d'import (sans gestion d'erreur)
  };
};
