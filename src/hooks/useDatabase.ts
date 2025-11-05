/**
 * Importations React et dépendances pour useDatabase
 */
import { useCallback, useEffect, useRef, useState } from 'react';
// Importation des alertes React Native pour les notifications utilisateur
import { Alert } from 'react-native';
// Importation de QuickSQLite pour la gestion de base de données
import { open, type QuickSQLiteConnection } from 'react-native-quick-sqlite';

// Importations des types TypeScript pour le typage strict
import type {
  ClientWithRelations,
  ClientRow,
  FeeRow,
  PhoneRow,
  Fee,
  Phone,
  DatabaseName,
} from '../types';

/**
 * Type définissant les paramètres du hook useDatabase
 * Permet de spécifier quelle base de données utiliser (principale ou archive)
 */
type UseDatabaseParams = {
  databaseName?: DatabaseName; // 'main' pour la base principale, 'archive' pour les archives
};

/**
 * Type pour les données d'un client sans l'ID (utilisé pour création/modification)
 * L'ID est généré automatiquement par la base de données
 */
type ClientPayload = Omit<ClientWithRelations, 'id'>;

/**
 * Type définissant le résultat d'une exécution de requête SQLite
 * Structure retournée par react-native-quick-sqlite
 */
type ExecuteResult = {
  rows?: {
    _array: unknown[]; // Tableau des résultats de la requête
    length: number; // Nombre de lignes retournées
  };
  insertId?: number | string | null; // ID généré lors d'un INSERT
};

/**
 * Fonction utilitaire pour créer le schéma de base de données si nécessaire
 * Définit les tables clients, frais et telephones avec leurs contraintes
 * Active les clés étrangères et crée les index pour optimiser les performances
 */
const ensureSchema = (db: QuickSQLiteConnection) => {
  // Activation des clés étrangères pour l'intégrité référentielle
  db.execute('PRAGMA foreign_keys = ON');

  // Table principale des clients
  db.execute(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,  -- ID auto-incrémenté
      nom TEXT NOT NULL UNIQUE,               -- Nom unique du client
      page INTEGER NOT NULL UNIQUE,           -- Numéro de page unique
      note TEXT,                              -- Notes optionnelles
      montant_total REAL NOT NULL DEFAULT 0,  -- Montant total de la commande
      montant_restant REAL NOT NULL DEFAULT 0,-- Montant restant à payer
      date_ajout TEXT NOT NULL,               -- Date d'ajout (format JJ/MM/AAAA)
      statut INTEGER NOT NULL DEFAULT 0 CHECK (statut IN (0, 1)) -- 0=en cours, 1=terminé
    )
  `);

  // Table des frais supplémentaires liés aux clients
  db.execute(`
    CREATE TABLE IF NOT EXISTS frais (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,             -- Référence vers le client
      type TEXT NOT NULL,                     -- Type de frais (ex: "livraison")
      montant REAL NOT NULL DEFAULT 0,        -- Montant du frais
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )
  `);

  // Table des numéros de téléphone liés aux clients
  db.execute(`
    CREATE TABLE IF NOT EXISTS telephones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,             -- Référence vers le client
      numero TEXT NOT NULL,                   -- Numéro de téléphone
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )
  `);

  // Index pour optimiser les requêtes sur les frais par client
  db.execute('CREATE INDEX IF NOT EXISTS idx_frais_client ON frais(client_id)');
  // Index pour optimiser les requêtes sur les téléphones par client
  db.execute('CREATE INDEX IF NOT EXISTS idx_tel_client ON telephones(client_id)');
};

/**
 * Fonction utilitaire pour transformer les résultats bruts de la base de données
 * en objets ClientWithRelations avec leurs relations (frais et téléphones)
 * Utilise une Map pour l'efficacité et assure le tri par numéro de page
 */
const mapRowsToClients = (
  clientRows: ClientRow[],  // Résultats de la requête clients
  feeRows: FeeRow[],       // Résultats de la requête frais
  phoneRows: PhoneRow[],   // Résultats de la requête téléphones
): ClientWithRelations[] => {
  // Map pour stocker les clients avec leur ID comme clé
  const clientsMap = new Map<number, ClientWithRelations>();

  // Première passe : créer tous les clients avec leurs données de base
  for (const clientRow of clientRows) {
    clientsMap.set(clientRow.id, {
      id: clientRow.id,
      nom: clientRow.nom,
      page: clientRow.page,
      note: clientRow.note ?? '', // Valeur par défaut si null
      montantTotal: clientRow.montantTotal,
      montantRestant: clientRow.montantRestant,
      dateAjout: clientRow.dateAjout,
      statut: clientRow.statut === 1, // Conversion integer vers boolean
      frais: [],      // Initialisation du tableau des frais
      telephones: [], // Initialisation du tableau des téléphones
    });
  }

  // Deuxième passe : ajouter les frais à chaque client
  for (const feeRow of feeRows) {
    const client = clientsMap.get(feeRow.clientId);
    if (client) {
      client.frais.push({
        type: feeRow.type,
        montant: feeRow.montant,
      });
    }
  }

  // Troisième passe : ajouter les téléphones à chaque client
  for (const phoneRow of phoneRows) {
    const client = clientsMap.get(phoneRow.clientId);
    if (client) {
      client.telephones.push({
        numero: phoneRow.numero,
      });
    }
  }

  // Retourner les clients triés par numéro de page croissant
  return Array.from(clientsMap.values()).sort((a, b) => a.page - b.page);
};

/**
 * Hook personnalisé useDatabase - Gestion complète de la base de données SQLite
 * Fournit toutes les opérations CRUD sur les clients avec gestion des relations
 * Supporte deux bases de données : principale et archives
 * Gère l'initialisation, les erreurs et la fermeture propre des connexions
 */
export const useDatabase = (params?: UseDatabaseParams) => {
  // Détermination du nom de fichier de base de données selon le paramètre
  const dbName = params?.databaseName === 'archive' ? 'monprojet_archive.db' : 'monprojet.db';

  // Référence pour stocker la connexion à la base de données
  const dbRef = useRef<QuickSQLiteConnection | null>(null);

  // États pour suivre l'état de la connexion
  const [isReady, setIsReady] = useState(false); // True quand la DB est prête
  const [error, setError] = useState<Error | null>(null); // Erreur éventuelle

  /**
   * Effet pour initialiser la base de données au montage du composant
   * Gère l'ouverture de la connexion, la création du schéma et la fermeture propre
   */
  useEffect(() => {
    let cancelled = false; // Flag pour éviter les opérations après démontage

    const initializeDatabase = async () => {
      try {
        // Ouverture de la connexion à la base de données
        const connection = open({ name: dbName });
        // Création du schéma si nécessaire
        ensureSchema(connection);

        // Vérification si le composant a été démonté pendant l'initialisation
        if (cancelled) {
          connection.close();
          return;
        }

        // Stockage de la connexion et mise à jour des états
        dbRef.current = connection;
        setIsReady(true);
        setError(null);
      } catch (err) {
        // Normalisation de l'erreur et mise à jour des états
        const normalizedError = err instanceof Error ? err : new Error(String(err));
        setError(normalizedError);
        setIsReady(false);
      }
    };

    // Lancement de l'initialisation (sans await pour éviter les warnings)
    initializeDatabase().catch(() => {});

    // Fonction de nettoyage appelée au démontage
    return () => {
      cancelled = true;
      setIsReady(false);
      if (dbRef.current) {
        dbRef.current.close();
        dbRef.current = null;
      }
    };
  }, [dbName]); // Re-exécution si le nom de DB change

  /**
   * Fonction utilitaire pour obtenir la connexion DB avec vérification
   * Lance une erreur si la base n'est pas prête
   */
  const requireDb = useCallback((): QuickSQLiteConnection => {
    if (!dbRef.current) {
      throw new Error('Database not ready');
    }
    return dbRef.current;
  }, []);

  const loadClients = useCallback(async (): Promise<ClientWithRelations[]> => {
    const db = requireDb();
    ensureSchema(db);

    const clientsResult = (await db.executeAsync(
      `SELECT id,
              nom,
              page,
              note,
              montant_total AS montantTotal,
              montant_restant AS montantRestant,
              date_ajout AS dateAjout,
              statut
       FROM clients
       ORDER BY page ASC`,
    )) as ExecuteResult;
    const clientRows = clientsResult.rows ? (clientsResult.rows._array as ClientRow[]) : [];

    const fraisResult = (await db.executeAsync(
      `SELECT client_id AS clientId,
              type,
              montant
       FROM frais`,
    )) as ExecuteResult;
    const fraisRows = fraisResult.rows ? (fraisResult.rows._array as FeeRow[]) : [];

    const phonesResult = (await db.executeAsync(
      `SELECT client_id AS clientId,
              numero
       FROM telephones`,
    )) as ExecuteResult;
    const phoneRows = phonesResult.rows ? (phonesResult.rows._array as PhoneRow[]) : [];

    return mapRowsToClients(clientRows, fraisRows, phoneRows);
  }, [requireDb]);

  const insertFees = async (db: QuickSQLiteConnection, clientId: number, fees: Fee[]) => {
    for (const fee of fees) {
      await db.executeAsync(
        'INSERT INTO frais (client_id, type, montant) VALUES (?, ?, ?)',
        [clientId, fee.type, fee.montant],
      );
    }
  };

  const insertPhones = async (db: QuickSQLiteConnection, clientId: number, phones: Phone[]) => {
    for (const phone of phones) {
      await db.executeAsync(
        'INSERT INTO telephones (client_id, numero) VALUES (?, ?)',
        [clientId, phone.numero],
      );
    }
  };

  const createClient = useCallback(async (payload: ClientPayload): Promise<number> => {
    const db = requireDb();

    const insertResult = await db.executeAsync(
      `INSERT INTO clients (nom, page, note, montant_total, montant_restant, date_ajout, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.nom,
        payload.page,
        payload.note,
        payload.montantTotal,
        payload.montantRestant,
        payload.dateAjout,
        payload.statut ? 1 : 0,
      ],
    );

    const clientId = Number(insertResult.insertId);
    if (!Number.isFinite(clientId)) {
      throw new Error('Invalid client insertion result');
    }

    await insertFees(db, clientId, payload.frais);
    await insertPhones(db, clientId, payload.telephones);

    return clientId;
  }, [requireDb]);

  const updateClient = useCallback(async (clientId: number, payload: ClientPayload): Promise<void> => {
    const db = requireDb();

    await db.executeAsync(
      `UPDATE clients
       SET nom = ?, page = ?, note = ?, montant_total = ?, montant_restant = ?, date_ajout = ?, statut = ?
       WHERE id = ?`,
      [
        payload.nom,
        payload.page,
        payload.note,
        payload.montantTotal,
        payload.montantRestant,
        payload.dateAjout,
        payload.statut ? 1 : 0,
        clientId,
      ],
    );

    await db.executeAsync('DELETE FROM frais WHERE client_id = ?', [clientId]);
    await insertFees(db, clientId, payload.frais);

    await db.executeAsync('DELETE FROM telephones WHERE client_id = ?', [clientId]);
    await insertPhones(db, clientId, payload.telephones);
  }, [requireDb]);

  const deleteClient = useCallback(async (clientId: number): Promise<void> => {
    const db = requireDb();
    await db.executeAsync('DELETE FROM clients WHERE id = ?', [clientId]);
  }, [requireDb]);

  const toggleClientStatus = useCallback(async (clientId: number, nextStatus: boolean): Promise<void> => {
    const db = requireDb();
    await db.executeAsync(
      'UPDATE clients SET statut = ? WHERE id = ?',
      [nextStatus ? 1 : 0, clientId],
    );
  }, [requireDb]);

  const clearAllData = useCallback(async (): Promise<void> => {
    const db = requireDb();
    await db.executeAsync('DELETE FROM telephones');
    await db.executeAsync('DELETE FROM frais');
    await db.executeAsync('DELETE FROM clients');
  }, [requireDb]);

  const checkDuplicateInDb = async (db: QuickSQLiteConnection, client: ClientWithRelations) => {
    const duplicateResult = (await db.executeAsync(
      `SELECT id FROM clients WHERE nom = ? OR page = ? LIMIT 1`,
      [client.nom, client.page],
    )) as ExecuteResult;

    if (duplicateResult.rows && duplicateResult.rows.length > 0) {
      throw new Error('Une cliente avec le même nom ou numéro de page existe déjà dans la base cible.');
    }
  };

  const archiveClient = useCallback(async (
    clientId: number,
    clientData: ClientWithRelations,
  ): Promise<void> => {
    const sourceDb = requireDb();

    try {
      const archiveDb = open({ name: 'monprojet_archive.db' });
      ensureSchema(archiveDb);
      await checkDuplicateInDb(archiveDb, clientData);

      const insertResult = await archiveDb.executeAsync(
        `INSERT INTO clients (nom, page, note, montant_total, montant_restant, date_ajout, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          clientData.nom,
          clientData.page,
          clientData.note,
          clientData.montantTotal,
          clientData.montantRestant,
          clientData.dateAjout,
          clientData.statut ? 1 : 0,
        ],
      );

      const newClientId = Number(insertResult.insertId);

      for (const fee of clientData.frais) {
        await archiveDb.executeAsync(
          'INSERT INTO frais (client_id, type, montant) VALUES (?, ?, ?)',
          [newClientId, fee.type, fee.montant],
        );
      }

      for (const phone of clientData.telephones) {
        await archiveDb.executeAsync(
          'INSERT INTO telephones (client_id, numero) VALUES (?, ?)',
          [newClientId, phone.numero],
        );
      }

      await sourceDb.executeAsync('DELETE FROM clients WHERE id = ?', [clientId]);
      Alert.alert('Succès', `${clientData.nom} a été archivée.`);
    } catch (err: unknown) {
      console.error('Erreur archiveClient', err);
      const message = err instanceof Error ? err.message : "Impossible d'archiver le client.";
      Alert.alert('Erreur', message);
      throw err;
    }
  }, [requireDb]);

  const unarchiveClient = useCallback(async (
    clientId: number,
    clientData: ClientWithRelations,
  ): Promise<void> => {
    const sourceDb = requireDb();

    try {
      const mainDb = open({ name: 'monprojet.db' });
      ensureSchema(mainDb);
      await checkDuplicateInDb(mainDb, clientData);

      const insertResult = await mainDb.executeAsync(
        `INSERT INTO clients (nom, page, note, montant_total, montant_restant, date_ajout, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          clientData.nom,
          clientData.page,
          clientData.note,
          clientData.montantTotal,
          clientData.montantRestant,
          clientData.dateAjout,
          clientData.statut ? 1 : 0,
        ],
      );

      const newClientId = Number(insertResult.insertId);

      for (const fee of clientData.frais) {
        await mainDb.executeAsync(
          'INSERT INTO frais (client_id, type, montant) VALUES (?, ?, ?)',
          [newClientId, fee.type, fee.montant],
        );
      }

      for (const phone of clientData.telephones) {
        await mainDb.executeAsync(
          'INSERT INTO telephones (client_id, numero) VALUES (?, ?)',
          [newClientId, phone.numero],
        );
      }

      await sourceDb.executeAsync('DELETE FROM clients WHERE id = ?', [clientId]);
      Alert.alert('Succès', `${clientData.nom} a été désarchivée.`);
    } catch (err: unknown) {
      console.error('Erreur unarchiveClient', err);
      const message = err instanceof Error ? err.message : "Impossible de désarchiver le client.";
      Alert.alert('Erreur', message);
      throw err;
    }
  }, [requireDb]);

  // Retour du hook avec toutes les fonctions de base de données et états
  return {
    // Opérations CRUD de base
    loadClients,     // Charger tous les clients avec leurs relations
    createClient,    // Créer un nouveau client
    updateClient,    // Modifier un client existant
    deleteClient,    // Supprimer un client

    // Opérations spéciales
    toggleClientStatus, // Basculer le statut d'un client
    clearAllData,       // Vider complètement la base de données

    // Gestion des archives
    archiveClient,      // Archiver un client (depuis DB principale vers archives)
    unarchiveClient,    // Désarchiver un client (depuis archives vers DB principale)

    // États de la connexion
    isReady, // True quand la base de données est prête
    error,   // Erreur éventuelle lors de l'initialisation
  };
};

export type UseDatabaseReturn = ReturnType<typeof useDatabase>;
