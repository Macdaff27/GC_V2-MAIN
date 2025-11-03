import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useDatabase } from './useDatabase';
import type {
  ClientWithRelations,
  DatabaseName,
  ClientFormValues,
} from '../types';
import {
  createEmptyFormValues,
  createFormValuesFromClient,
} from '../components/ClientFormModal';
import {
  formatDateForStorage,
} from '../utils/format';

interface UseClientActionsParams {
  activeDatabase: DatabaseName;
  onLoadClients: () => Promise<void>;
  onSetFormVisible: (visible: boolean) => void;
  onSetFormInitialValues: (values: ClientFormValues | null) => void;
  onSetFormSubmitting: (submitting: boolean) => void;
  onSetPendingScrollClientId: (id: number | null) => void;
  onSetShouldRestoreScroll: (restore: boolean) => void;
}

export const useClientActions = ({
  activeDatabase,
  onLoadClients,
  onSetFormVisible,
  onSetFormInitialValues,
  onSetFormSubmitting,
  onSetPendingScrollClientId,
  onSetShouldRestoreScroll,
}: UseClientActionsParams) => {
  const mainDb = useDatabase({ databaseName: 'main' });
  const archiveDb = useDatabase({ databaseName: 'archive' });
  const activeDb = activeDatabase === 'main' ? mainDb : archiveDb;

  const {
    createClient: createDbClient,
    updateClient: updateDbClient,
    deleteClient: deleteDbClient,
    toggleClientStatus: toggleDbClientStatus,
    isReady,
  } = activeDb;

  const mainDbReady = mainDb.isReady;
  const archiveFromMain = mainDb.archiveClient;
  const unarchiveFromArchive = archiveDb.unarchiveClient;

  const handleToggleStatus = useCallback(async (client: ClientWithRelations) => {
    if (!isReady) {
      Alert.alert('Erreur', "La base de donn\u00E9es n'est pas pr\u00EAte.");
      return;
    }

    try {
      await toggleDbClientStatus(client.id, !client.statut);
      await onLoadClients();
      const message = client.statut ? 'Commande marquee en cours.' : 'Commande marquee terminee.';
      Alert.alert('Succes', message);
    } catch (error) {
      console.error('Erreur lors du changement de statut', error);
      Alert.alert('Erreur', "Impossible de mettre \u00E0 jour le statut.");
    }
  }, [isReady, onLoadClients, toggleDbClientStatus]);

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
            onSetShouldRestoreScroll(true);
            console.log('[LIST]', `Suppression ${client.id} (offset courant conservé).`);

            const removeClient = async () => {
              try {
                await deleteDbClient(client.id);
                await onLoadClients();
                Alert.alert('Succes', 'Client supprime.');
              } catch (error) {
                console.error('Erreur lors de la suppression', error);
                Alert.alert('Erreur', 'Impossible de supprimer ce client.');
              }
            };
            removeClient();
          },
        },
      ],
    );
  }, [deleteDbClient, isReady, onLoadClients, onSetShouldRestoreScroll]);

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
              await onLoadClients();
            } catch (error) {
              console.error('Erreur archivage', error);
            }
          },
        },
      ],
    );
  }, [archiveFromMain, onLoadClients, mainDbReady]);

  const handleUnarchiveClient = useCallback((client: ClientWithRelations) => {
    if (!archiveDb.isReady) {
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
              await onLoadClients();
            } catch (error) {
              console.error('Erreur d\u00E9sarchivage', error);
            }
          },
        },
      ],
    );
  }, [archiveDb.isReady, onLoadClients, unarchiveFromArchive]);

  const handleCreateClient = useCallback(() => {
    onSetShouldRestoreScroll(true);
    console.log('[LIST]', `Formulaire d'ajout ouvert (scroll sera restauré).`);
    onSetFormInitialValues(createEmptyFormValues());
    onSetFormVisible(true);
  }, [onSetFormInitialValues, onSetFormVisible, onSetShouldRestoreScroll]);

  const handleEditClient = useCallback((client: ClientWithRelations) => {
    onSetFormInitialValues(createFormValuesFromClient(client));
    onSetFormVisible(true);
  }, [onSetFormInitialValues, onSetFormVisible]);

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

    onSetFormSubmitting(true);

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
        onSetPendingScrollClientId(clientId);
      } else {
        onSetPendingScrollClientId(null);
      }

      await onLoadClients();
      onSetFormVisible(false);
      onSetFormInitialValues(null);
      Alert.alert('Succes', values.id ? 'Cliente mise a jour.' : 'Cliente ajoutee.');
    } catch (error) {
      onSetPendingScrollClientId(null);
      console.error('Erreur enregistrement cliente', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder cette cliente.');
    } finally {
      onSetFormSubmitting(false);
    }
  }, [
    createDbClient,
    isReady,
    onLoadClients,
    onSetFormSubmitting,
    onSetFormVisible,
    onSetFormInitialValues,
    onSetPendingScrollClientId,
    updateDbClient,
  ]);

  const handleCloseForm = useCallback(() => {
    onSetFormVisible(false);
    onSetFormInitialValues(null);
  }, [onSetFormVisible, onSetFormInitialValues]);

  return {
    handleToggleStatus,
    handleDeleteClient,
    handleArchiveClient,
    handleUnarchiveClient,
    handleCreateClient,
    handleEditClient,
    handleSubmitClientForm,
    handleCloseForm,
  };
};

export type UseClientActionsReturn = ReturnType<typeof useClientActions>;
