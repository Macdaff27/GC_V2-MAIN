import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { open, type QuickSQLiteConnection } from 'react-native-quick-sqlite';

import type {
  ClientWithRelations,
  ClientRow,
  FeeRow,
  PhoneRow,
  Fee,
  Phone,
  DatabaseName,
} from '../types';

type UseDatabaseParams = {
  databaseName?: DatabaseName;
};

type ClientPayload = Omit<ClientWithRelations, 'id'>;

type ExecuteResult = {
  rows?: {
    _array: unknown[];
    length: number;
  };
  insertId?: number | string | null;
};

const ensureSchema = (db: QuickSQLiteConnection) => {
  db.execute('PRAGMA foreign_keys = ON');
  db.execute(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL UNIQUE,
      page INTEGER NOT NULL UNIQUE,
      note TEXT,
      montant_total REAL NOT NULL DEFAULT 0,
      montant_restant REAL NOT NULL DEFAULT 0,
      date_ajout TEXT NOT NULL,
      statut INTEGER NOT NULL DEFAULT 0 CHECK (statut IN (0, 1))
    )
  `);
  db.execute(`
    CREATE TABLE IF NOT EXISTS frais (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      montant REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )
  `);
  db.execute(`
    CREATE TABLE IF NOT EXISTS telephones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      numero TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )
  `);

  db.execute('CREATE INDEX IF NOT EXISTS idx_frais_client ON frais(client_id)');
  db.execute('CREATE INDEX IF NOT EXISTS idx_tel_client ON telephones(client_id)');
};

const mapRowsToClients = (
  clientRows: ClientRow[],
  feeRows: FeeRow[],
  phoneRows: PhoneRow[],
): ClientWithRelations[] => {
  const clientsMap = new Map<number, ClientWithRelations>();

  for (const clientRow of clientRows) {
    clientsMap.set(clientRow.id, {
      id: clientRow.id,
      nom: clientRow.nom,
      page: clientRow.page,
      note: clientRow.note ?? '',
      montantTotal: clientRow.montantTotal,
      montantRestant: clientRow.montantRestant,
      dateAjout: clientRow.dateAjout,
      statut: clientRow.statut === 1,
      frais: [],
      telephones: [],
    });
  }

  for (const feeRow of feeRows) {
    const client = clientsMap.get(feeRow.clientId);
    if (client) {
      client.frais.push({
        type: feeRow.type,
        montant: feeRow.montant,
      });
    }
  }

  for (const phoneRow of phoneRows) {
    const client = clientsMap.get(phoneRow.clientId);
    if (client) {
      client.telephones.push({
        numero: phoneRow.numero,
      });
    }
  }

  return Array.from(clientsMap.values()).sort((a, b) => a.page - b.page);
};

export const useDatabase = (params?: UseDatabaseParams) => {
  const dbName = params?.databaseName === 'archive' ? 'monprojet_archive.db' : 'monprojet.db';
  const dbRef = useRef<QuickSQLiteConnection | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const initializeDatabase = async () => {
      try {
        const connection = open({ name: dbName });
        ensureSchema(connection);

        if (cancelled) {
          connection.close();
          return;
        }

        dbRef.current = connection;
        setIsReady(true);
        setError(null);
      } catch (err) {
        const normalizedError = err instanceof Error ? err : new Error(String(err));
        setError(normalizedError);
        setIsReady(false);
      }
    };

    initializeDatabase().catch(() => {});

    return () => {
      cancelled = true;
      setIsReady(false);
      if (dbRef.current) {
        dbRef.current.close();
        dbRef.current = null;
      }
    };
  }, [dbName]);

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

  return {
    loadClients,
    createClient,
    updateClient,
    deleteClient,
    toggleClientStatus,
    clearAllData,
    archiveClient,
    unarchiveClient,
    isReady,
    error,
  };
};

export type UseDatabaseReturn = ReturnType<typeof useDatabase>;
