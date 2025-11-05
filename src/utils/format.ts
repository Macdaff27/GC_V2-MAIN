/**
 * Utilitaires de formatage et normalisation des données
 * Fournit des fonctions pour le traitement des dates, montants, statuts et imports JSON
 */

import type { ImportedClient, JsonImportShape } from '../types';

/**
 * Ajoute un zéro devant les nombres < 10 pour un formatage cohérent
 * @param value - Nombre à formater (0-99)
 * @returns Chaîne de 2 caractères avec zéro devant si nécessaire
 * @example pad(5) => "05", pad(15) => "15"
 */
export const pad = (value: number): string => value.toString().padStart(2, '0');

/**
 * Formate une date au format JJ/MM/AAAA
 * @param date - Objet Date à formater
 * @returns Date formatée (ex: "15/01/2024")
 */
export const formatDate = (date: Date): string =>
  `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;

/**
 * Normalise les données d'import JSON en tableau uniforme d'ImportedClient
 * Supporte différents formats de fichiers d'import (API, exports divers, objets simples)
 * @param raw - Données brutes du fichier JSON (peut être array, objet ou autre)
 * @returns Tableau normalisé d'ImportedClient
 */
export const normalizeParsedInput = (raw: JsonImportShape): ImportedClient[] => {
  /**
   * Fonction helper pour s'assurer qu'une valeur est un tableau d'ImportedClient
   * Filtre les valeurs null/undefined et valide le type
   */
  const ensureArray = (candidate: unknown): ImportedClient[] => {
    if (!Array.isArray(candidate)) {
      return [];
    }
    return candidate.filter((entry): entry is ImportedClient => !!entry);
  };

  // Cas 1 : L'entrée est déjà un tableau
  if (Array.isArray(raw)) {
    return ensureArray(raw);
  }

  // Cas 2 : L'entrée est un objet (format API ou wrapper)
  if (raw && typeof raw === 'object') {
    const typed = raw as {
      data?: ImportedClient[] | { items?: ImportedClient[] }; // Format API standard
      results?: ImportedClient[]; // Format alternatif
      clientes?: ImportedClient[]; // Variante française
      clients?: ImportedClient[]; // Variante anglaise
    };

    const collected: ImportedClient[] = [];

    /**
     * Fonction helper pour ajouter une collection au résultat
     * Gère automatiquement la conversion en tableau
     */
    const pushCollection = (value: unknown) => {
      collected.push(...ensureArray(value));
    };

    // Extraction depuis les propriétés connues
    pushCollection(typed.data);

    // Support des objets imbriqués (ex: { data: { items: [...] } })
    if (typed.data && !Array.isArray(typed.data) && typeof typed.data === 'object') {
      const nested = (typed.data as { items?: ImportedClient[] }).items;
      pushCollection(nested);
    }

    pushCollection(typed.results);
    pushCollection(typed.clientes);
    pushCollection(typed.clients);

    // Si on a trouvé des données dans les propriétés, les retourner
    if (collected.length > 0) {
      return collected;
    }

    // Sinon, traiter l'objet comme un seul client
    return [raw as ImportedClient];
  }

  // Cas 3 : Format non supporté ou vide
  return [];
};

/**
 * Formate une date pour le stockage en base de données
 * Accepte différents formats d'entrée et normalise vers JJ/MM/AAAA
 * @param value - Chaîne de date optionnelle (format flexible)
 * @returns Date formatée JJ/MM/AAAA (date actuelle si invalide)
 */
export const formatDateForStorage = (value?: string): string => {
  // Valeur par défaut : date actuelle
  if (!value) {
    return formatDate(new Date());
  }

  const trimmed = value.trim();

  // Regex pour détecter le format JJ/MM/AAAA
  const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = trimmed.match(ddmmyyyy);
  let parsed: Date | null = null;

  if (match) {
    // Extraction des composants de date
    const [, dd, mm, yyyy] = match;
    const day = Number(dd);
    const month = Number(mm) - 1; // JavaScript utilise l'index 0 pour les mois
    const year = Number(yyyy);

    const candidate = new Date(year, month, day);
    // Validation de la date (vérifie si elle est valide)
    parsed = Number.isNaN(candidate.getTime()) ? null : candidate;
  } else {
    // Tentative de parsing direct (pour les formats ISO ou autres)
    const candidate = new Date(trimmed);
    parsed = Number.isNaN(candidate.getTime()) ? null : candidate;
  }

  // Retour de la date parsée ou de la date actuelle en fallback
  return formatDate(parsed ?? new Date());
};

/**
 * Normalise une valeur en nombre valide
 * Utilisé pour les montants et autres valeurs numériques
 * @param value - Valeur à convertir en nombre
 * @returns Nombre valide ou 0 en cas d'échec
 */
export const normalizeAmount = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Normalise une valeur en booléen de statut
 * Supporte différents formats d'entrée (boolean, number, string)
 * Interprète intelligemment les chaînes de caractères
 * @param value - Valeur à convertir en booléen
 * @returns true si terminé/payé, false sinon
 */
export const normalizeStatus = (value: unknown): boolean => {
  // Cas direct : déjà un booléen
  if (typeof value === 'boolean') {
    return value;
  }

  // Cas nombre : 1 = true, autres = false
  if (typeof value === 'number') {
    return value === 1;
  }

  // Cas chaîne : interprétation intelligente
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    // Normalisation Unicode pour supprimer les accents
    const ascii = normalized
      .normalize('NFD') // Décompose les caractères accentués
      .split('')
      .filter((char) => {
        const code = char.charCodeAt(0);
        // Garde seulement les caractères de base (supprime les accents)
        return code < 0x0300 || code > 0x036F;
      })
      .join('');

    // Valeurs vraies explicites
    if (ascii === '1' || ascii === 'true' || ascii === 'oui') {
      return true;
    }

    // Valeurs fausses explicites
    if (ascii === '0' || ascii === 'false' || ascii === 'non') {
      return false;
    }

    // Mots-clés indiquant un statut terminé
    if (
      ascii === 'termine' ||
      ascii === 'terminee' ||
      ascii === 'paye' ||
      ascii === 'payee' ||
      ascii === 'regle' ||
      ascii === 'reglee' ||
      ascii === 'solde' ||
      ascii === 'soldes'
    ) {
      return true;
    }
  }

  // Par défaut : considéré comme non terminé
  return false;
};

/**
 * Normalise une valeur en chaîne de caractères
 * @param value - Valeur à convertir en string
 * @returns Chaîne vide si non-string, sinon la valeur originale
 */
export const normalizeString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

/**
 * Construit un nom de fichier pour l'export JSON
 * Format : clients-AAAA-MM-JJ_HH-MM-SS.json
 * @param date - Date à utiliser (date actuelle par défaut)
 * @returns Nom de fichier avec timestamp
 */
export const buildExportFileName = (date = new Date()): string =>
  `clients-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}.json`;

/**
 * Formate un montant en devise (Dinars Algériens)
 * Arrondit à l'entier le plus proche et ajoute le symbole DA
 * @param amount - Montant à formater
 * @returns Montant formaté avec devise (ex: "1 234 DA")
 */
export const formatCurrency = (amount: number): string =>
  `${Math.round(amount).toLocaleString('fr-FR')} DA`;
