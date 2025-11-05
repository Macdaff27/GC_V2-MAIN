/**
 * Utilitaires de validation centralisés pour l'application
 * Fournit des validateurs robustes pour toutes les entités métier
 * Assure la sécurité des données et l'expérience utilisateur
 */

import type { ClientWithRelations, ClientFormValues, ImportedClient } from '../types';
import type { Validator, ValidationResult } from '../types/utils';

/**
 * Validation des noms de clients
 * Vérifie la longueur, les caractères et la sécurité
 * @param name - Le nom à valider
 * @returns Résultat de validation avec erreurs détaillées
 */
export const validateName = (name: string): ValidationResult => {
  const trimmed = name.trim();

  // Vérification de présence
  if (!trimmed) {
    return { isValid: false, errors: ['Le nom est requis'] };
  }

  // Vérification de longueur minimale
  if (trimmed.length < 2) {
    return { isValid: false, errors: ['Le nom doit contenir au moins 2 caractères'] };
  }

  // Vérification de longueur maximale
  if (trimmed.length > 100) {
    return { isValid: false, errors: ['Le nom ne peut pas dépasser 100 caractères'] };
  }

  // Vérification de sécurité : caractères HTML dangereux
  const dangerousChars = /[<>"'&]/;
  if (dangerousChars.test(trimmed)) {
    return { isValid: false, errors: ['Le nom contient des caractères non autorisés'] };
  }

  return { isValid: true };
};

/**
 * Validation des numéros de page
 * Vérifie que c'est un entier positif dans une plage réaliste
 * @param page - Le numéro de page à valider
 * @returns Résultat de validation
 */
export const validatePage = (page: number): ValidationResult => {
  // Vérification que c'est un entier
  if (!Number.isInteger(page)) {
    return { isValid: false, errors: ['Le numéro de page doit être un entier'] };
  }

  // Vérification positif
  if (page < 1) {
    return { isValid: false, errors: ['Le numéro de page doit être positif'] };
  }

  // Vérification limite supérieure (éviter les valeurs absurdes)
  if (page > 10000) {
    return { isValid: false, errors: ['Le numéro de page est trop élevé'] };
  }

  return { isValid: true };
};

/**
 * Validation des montants financiers
 * Vérifie le type, la plage et la précision décimale
 * @param amount - Le montant à valider
 * @returns Résultat de validation
 */
export const validateAmount = (amount: number): ValidationResult => {
  // Vérification du type
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { isValid: false, errors: ['Le montant doit être un nombre valide'] };
  }

  // Vérification positif ou nul
  if (amount < 0) {
    return { isValid: false, errors: ['Le montant ne peut pas être négatif'] };
  }

  // Vérification limite supérieure (100 millions)
  if (amount > 100000000) {
    return { isValid: false, errors: ['Le montant est trop élevé'] };
  }

  // Vérification précision : maximum 2 décimales
  if (Math.round(amount * 100) !== amount * 100) {
    return { isValid: false, errors: ['Le montant ne peut avoir que 2 décimales maximum'] };
  }

  return { isValid: true };
};

/**
 * Validation des dates
 * Accepte différents formats et vérifie la plausibilité temporelle
 * @param dateString - La chaîne de date à valider
 * @returns Résultat de validation
 */
export const validateDate = (dateString: string): ValidationResult => {
  // Vérification de présence
  if (!dateString.trim()) {
    return { isValid: false, errors: ['La date est requise'] };
  }

  // Tentative de parsing
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { isValid: false, errors: ['Format de date invalide'] };
  }

  // Vérifications de plausibilité : ±1 an autour de la date actuelle
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

  if (date < oneYearAgo) {
    return { isValid: false, errors: ['La date ne peut pas être antérieure à un an'] };
  }

  if (date > oneYearFromNow) {
    return { isValid: false, errors: ['La date ne peut pas être postérieure à un an'] };
  }

  return { isValid: true };
};

/**
 * Validation des numéros de téléphone algériens
 * Supporte les formats locaux et internationaux
 * @param phone - Le numéro de téléphone à valider
 * @returns Résultat de validation (optionnel si vide)
 */
export const validatePhoneNumber = (phone: string): ValidationResult => {
  const trimmed = phone.trim();

  // Les téléphones sont optionnels
  if (!trimmed) {
    return { isValid: true };
  }

  // Regex pour numéros algériens :
  // - Commence par 0 (local) ou +213/00213 (international)
  // - Suivi de 5, 6 ou 7 (opérateurs mobiles)
  // - Puis 8 chiffres
  const phoneRegex = /^(?:(?:\+|00)213|0)[5-7]\d{8}$/;

  if (!phoneRegex.test(trimmed.replace(/\s+/g, ''))) {
    return { isValid: false, errors: ['Format de numéro de téléphone invalide'] };
  }

  return { isValid: true };
};

/**
 * Validation complète d'un client avec toutes ses relations
 * Agrège toutes les validations individuelles et vérifie la cohérence
 * @param client - Client partiellement défini à valider
 * @returns Résultat de validation avec toutes les erreurs trouvées
 */
export const validateClient = (client: Partial<ClientWithRelations>): ValidationResult => {
  const errors: string[] = [];

  // Validation du nom (requis)
  const nameValidation = validateName(client.nom || '');
  if (!nameValidation.isValid) {
    errors.push(...nameValidation.errors);
  }

  // Validation de la page (si définie)
  if (client.page !== undefined) {
    const pageValidation = validatePage(client.page);
    if (!pageValidation.isValid) {
      errors.push(...pageValidation.errors);
    }
  }

  // Validation des montants (si définis)
  if (client.montantTotal !== undefined) {
    const totalValidation = validateAmount(client.montantTotal);
    if (!totalValidation.isValid) {
      errors.push(...totalValidation.errors);
    }
  }

  if (client.montantRestant !== undefined) {
    const restantValidation = validateAmount(client.montantRestant);
    if (!restantValidation.isValid) {
      errors.push(...restantValidation.errors);
    }

    // Règle métier : le restant ne peut pas dépasser le total
    if (client.montantTotal !== undefined && client.montantRestant > client.montantTotal) {
      errors.push('Le montant restant ne peut pas être supérieur au montant total');
    }
  }

  // Validation des téléphones (si présents)
  if (client.telephones) {
    client.telephones.forEach((phone, index) => {
      const phoneValidation = validatePhoneNumber(phone.numero);
      if (!phoneValidation.isValid) {
        errors.push(`Téléphone ${index + 1}: ${phoneValidation.errors.join(', ')}`);
      }
    });
  }

  // Validation des frais (si présents)
  if (client.frais) {
    client.frais.forEach((frais, index) => {
      // Type requis pour chaque frais
      if (!frais.type?.trim()) {
        errors.push(`Frais ${index + 1}: Le type est requis`);
      }

      // Montant valide
      const amountValidation = validateAmount(frais.montant);
      if (!amountValidation.isValid) {
        errors.push(`Frais ${index + 1}: ${amountValidation.errors.join(', ')}`);
      }
    });
  }

  return errors.length === 0
    ? { isValid: true }
    : { isValid: false, errors };
};

/**
 * Validation des valeurs d'un formulaire de client
 * Adapte les validateurs pour les formats string des formulaires
 * Gère les conversions string → number et les champs optionnels
 * @param values - Valeurs du formulaire à valider
 * @returns Résultat de validation avec toutes les erreurs
 */
export const validateClientForm = (values: ClientFormValues): ValidationResult => {
  const errors: string[] = [];

  // Validation du nom (string direct)
  const nameValidation = validateName(values.nom);
  if (!nameValidation.isValid) {
    errors.push(...nameValidation.errors);
  }

  // Validation de la page (conversion string → number)
  const pageValidation = validatePage(parseInt(values.page, 10));
  if (!pageValidation.isValid) {
    errors.push(...pageValidation.errors);
  }

  // Validation des montants (conversion string → number)
  const totalValidation = validateAmount(parseFloat(values.montantTotal));
  if (!totalValidation.isValid) {
    errors.push(...totalValidation.errors);
  }

  const restantValidation = validateAmount(parseFloat(values.montantRestant));
  if (!restantValidation.isValid) {
    errors.push(...restantValidation.errors);
  }

  // Règle métier : cohérence total/restant
  const total = parseFloat(values.montantTotal);
  const restant = parseFloat(values.montantRestant);
  if (!isNaN(total) && !isNaN(restant) && restant > total) {
    errors.push('Le montant restant ne peut pas être supérieur au montant total');
  }

  // Validation des téléphones (optionnels, indexés)
  values.telephones.forEach((phone, index) => {
    if (phone.numero.trim()) {
      const phoneValidation = validatePhoneNumber(phone.numero);
      if (!phoneValidation.isValid) {
        errors.push(`Téléphone ${index + 1}: ${phoneValidation.errors.join(', ')}`);
      }
    }
  });

  // Validation des frais (champs requis, conversion montant)
  values.frais.forEach((frais, index) => {
    // Type requis
    if (!frais.type.trim()) {
      errors.push(`Frais ${index + 1}: Le type est requis`);
    }

    // Montant : conversion et validation
    const amount = parseFloat(frais.montant);
    if (isNaN(amount)) {
      errors.push(`Frais ${index + 1}: Montant invalide`);
    } else {
      const amountValidation = validateAmount(amount);
      if (!amountValidation.isValid) {
        errors.push(`Frais ${index + 1}: ${amountValidation.errors.join(', ')}`);
      }
    }
  });

  return errors.length === 0
    ? { isValid: true }
    : { isValid: false, errors };
};

/**
 * Validation des données importées depuis des fichiers externes
 * Adapté pour les données partielles et formats variables des imports
 * Tous les champs sont optionnels car les fichiers peuvent être incomplets
 * @param client - Données importées à valider
 * @returns Résultat de validation avec erreurs préfixées par champ
 */
export const validateImportedClient = (client: ImportedClient): ValidationResult => {
  const errors: string[] = [];

  // Validation du nom (optionnel pour l'import)
  if (client.nom !== undefined) {
    const nameValidation = validateName(client.nom);
    if (!nameValidation.isValid) {
      errors.push(`Nom: ${nameValidation.errors.join(', ')}`);
    }
  }

  // Validation de la page (optionnel pour l'import)
  if (client.page !== undefined) {
    const pageValidation = validatePage(client.page);
    if (!pageValidation.isValid) {
      errors.push(`Page: ${pageValidation.errors.join(', ')}`);
    }
  }

  // Validation des montants (optionnels, support string/number)
  if (client.montantTotal !== undefined) {
    const totalNum = typeof client.montantTotal === 'string' ? parseFloat(client.montantTotal) : client.montantTotal;
    const totalValidation = validateAmount(totalNum);
    if (!totalValidation.isValid) {
      errors.push(`Montant total: ${totalValidation.errors.join(', ')}`);
    }
  }

  if (client.montantRestant !== undefined) {
    const restantNum = typeof client.montantRestant === 'string' ? parseFloat(client.montantRestant) : client.montantRestant;
    const restantValidation = validateAmount(restantNum);
    if (!restantValidation.isValid) {
      errors.push(`Montant restant: ${restantValidation.errors.join(', ')}`);
    }
  }

  // Validation des téléphones (array de strings)
  if (client.telephones) {
    client.telephones.forEach((phone, index) => {
      if (typeof phone === 'string' && phone.trim()) {
        const phoneValidation = validatePhoneNumber(phone);
        if (!phoneValidation.isValid) {
          errors.push(`Téléphone ${index + 1}: ${phoneValidation.errors.join(', ')}`);
        }
      }
    });
  }

  // Validation des frais (array d'objets avec champs optionnels)
  if (client.frais) {
    client.frais.forEach((frais, index) => {
      // Type optionnel mais doit être non-vide s'il existe
      if (!frais?.type?.trim()) {
        errors.push(`Frais ${index + 1}: Le type est requis`);
      }

      // Montant optionnel mais doit être valide s'il existe
      if (frais?.montant !== undefined) {
        const amountNum = typeof frais.montant === 'string' ? parseFloat(frais.montant) : frais.montant;
        const amountValidation = validateAmount(amountNum);
        if (!amountValidation.isValid) {
          errors.push(`Frais ${index + 1}: ${amountValidation.errors.join(', ')}`);
        }
      }
    });
  }

  return errors.length === 0
    ? { isValid: true }
    : { isValid: false, errors };
};

/**
 * Nettoyage et sécurisation des entrées utilisateur
 * Protège contre les attaques XSS et normalise le format
 * @param input - Chaîne brute saisie par l'utilisateur
 * @returns Chaîne nettoyée et sécurisée
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim() // Supprimer les espaces en début/fin
    .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul
    .replace(/[<>"'&]/g, '') // Supprimer les caractères HTML dangereux (XSS)
    .substring(0, 1000); // Limiter la longueur (éviter les attaques par déni de service)
};

/**
 * Créateur de validateurs personnalisés
 * Permet de composer des validateurs à partir de règles métier
 * Utile pour créer des validateurs spécifiques à certains contextes
 * @template T - Type de la valeur à valider
 * @param rules - Array de fonctions de validation retournant string | null
 * @returns Fonction validateur composée
 *
 * @example
 * ```typescript
 * const validateEmail = createValidator<string>([
 *   (email) => email.includes('@') ? null : 'Email invalide',
 *   (email) => email.length > 5 ? null : 'Email trop court'
 * ]);
 * ```
 */
export const createValidator = <T>(
  rules: Array<(value: T) => string | null>
): Validator<T> => {
  return (value: T): ValidationResult => {
    const errors: string[] = [];

    // Appliquer chaque règle et collecter les erreurs
    for (const rule of rules) {
      const error = rule(value);
      if (error) {
        errors.push(error);
      }
    }

    return errors.length === 0
      ? { isValid: true }
      : { isValid: false, errors };
  };
};
