import type { ClientWithRelations, ClientFormValues, ImportedClient } from '../types';
import type { Validator, ValidationResult } from '../types/utils';

/**
 * Utilitaires de validation centralisés pour l'application
 */

// Validation des noms
export const validateName = (name: string): ValidationResult => {
  const trimmed = name.trim();

  if (!trimmed) {
    return { isValid: false, errors: ['Le nom est requis'] };
  }

  if (trimmed.length < 2) {
    return { isValid: false, errors: ['Le nom doit contenir au moins 2 caractères'] };
  }

  if (trimmed.length > 100) {
    return { isValid: false, errors: ['Le nom ne peut pas dépasser 100 caractères'] };
  }

  // Vérifier les caractères spéciaux dangereux
  const dangerousChars = /[<>"'&]/;
  if (dangerousChars.test(trimmed)) {
    return { isValid: false, errors: ['Le nom contient des caractères non autorisés'] };
  }

  return { isValid: true };
};

// Validation des pages
export const validatePage = (page: number): ValidationResult => {
  if (!Number.isInteger(page)) {
    return { isValid: false, errors: ['Le numéro de page doit être un entier'] };
  }

  if (page < 1) {
    return { isValid: false, errors: ['Le numéro de page doit être positif'] };
  }

  if (page > 10000) {
    return { isValid: false, errors: ['Le numéro de page est trop élevé'] };
  }

  return { isValid: true };
};

// Validation des montants
export const validateAmount = (amount: number): ValidationResult => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { isValid: false, errors: ['Le montant doit être un nombre valide'] };
  }

  if (amount < 0) {
    return { isValid: false, errors: ['Le montant ne peut pas être négatif'] };
  }

  if (amount > 100000000) { // 100 millions
    return { isValid: false, errors: ['Le montant est trop élevé'] };
  }

  // Vérifier qu'il n'y a pas plus de 2 décimales
  if (Math.round(amount * 100) !== amount * 100) {
    return { isValid: false, errors: ['Le montant ne peut avoir que 2 décimales maximum'] };
  }

  return { isValid: true };
};

// Validation des dates
export const validateDate = (dateString: string): ValidationResult => {
  if (!dateString.trim()) {
    return { isValid: false, errors: ['La date est requise'] };
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { isValid: false, errors: ['Format de date invalide'] };
  }

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

// Validation des numéros de téléphone
export const validatePhoneNumber = (phone: string): ValidationResult => {
  const trimmed = phone.trim();

  if (!trimmed) {
    return { isValid: true }; // Optionnel
  }

  // Regex pour numéros algériens (commençant par 0 ou +213 ou 00213)
  const phoneRegex = /^(?:(?:\+|00)213|0)[5-7]\d{8}$/;

  if (!phoneRegex.test(trimmed.replace(/\s+/g, ''))) {
    return { isValid: false, errors: ['Format de numéro de téléphone invalide'] };
  }

  return { isValid: true };
};

// Validation d'un client complet
export const validateClient = (client: Partial<ClientWithRelations>): ValidationResult => {
  const errors: string[] = [];

  // Validation du nom
  const nameValidation = validateName(client.nom || '');
  if (!nameValidation.isValid) {
    errors.push(...nameValidation.errors);
  }

  // Validation de la page
  if (client.page !== undefined) {
    const pageValidation = validatePage(client.page);
    if (!pageValidation.isValid) {
      errors.push(...pageValidation.errors);
    }
  }

  // Validation des montants
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

    // Vérifier que le montant restant n'est pas supérieur au total
    if (client.montantTotal !== undefined && client.montantRestant > client.montantTotal) {
      errors.push('Le montant restant ne peut pas être supérieur au montant total');
    }
  }

  // Validation des téléphones
  if (client.telephones) {
    client.telephones.forEach((phone, index) => {
      const phoneValidation = validatePhoneNumber(phone.numero);
      if (!phoneValidation.isValid) {
        errors.push(`Téléphone ${index + 1}: ${phoneValidation.errors.join(', ')}`);
      }
    });
  }

  // Validation des frais
  if (client.frais) {
    client.frais.forEach((frais, index) => {
      if (!frais.type?.trim()) {
        errors.push(`Frais ${index + 1}: Le type est requis`);
      }

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

// Validation d'un formulaire de client
export const validateClientForm = (values: ClientFormValues): ValidationResult => {
  const errors: string[] = [];

  // Validation du nom
  const nameValidation = validateName(values.nom);
  if (!nameValidation.isValid) {
    errors.push(...nameValidation.errors);
  }

  // Validation de la page
  const pageValidation = validatePage(parseInt(values.page, 10));
  if (!pageValidation.isValid) {
    errors.push(...pageValidation.errors);
  }

  // Validation des montants
  const totalValidation = validateAmount(parseFloat(values.montantTotal));
  if (!totalValidation.isValid) {
    errors.push(...totalValidation.errors);
  }

  const restantValidation = validateAmount(parseFloat(values.montantRestant));
  if (!restantValidation.isValid) {
    errors.push(...restantValidation.errors);
  }

  // Vérifier que le montant restant n'est pas supérieur au total
  const total = parseFloat(values.montantTotal);
  const restant = parseFloat(values.montantRestant);
  if (!isNaN(total) && !isNaN(restant) && restant > total) {
    errors.push('Le montant restant ne peut pas être supérieur au montant total');
  }

  // Validation des téléphones
  values.telephones.forEach((phone, index) => {
    if (phone.numero.trim()) {
      const phoneValidation = validatePhoneNumber(phone.numero);
      if (!phoneValidation.isValid) {
        errors.push(`Téléphone ${index + 1}: ${phoneValidation.errors.join(', ')}`);
      }
    }
  });

  // Validation des frais
  values.frais.forEach((frais, index) => {
    if (!frais.type.trim()) {
      errors.push(`Frais ${index + 1}: Le type est requis`);
    }

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

// Validation des données importées
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

  // Validation des montants (optionnels pour l'import)
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

  // Validation des téléphones
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

  // Validation des frais
  if (client.frais) {
    client.frais.forEach((frais, index) => {
      if (!frais?.type?.trim()) {
        errors.push(`Frais ${index + 1}: Le type est requis`);
      }

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

// Nettoyage des entrées utilisateur
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul
    .replace(/[<>"'&]/g, '') // Supprimer les caractères HTML dangereux
    .substring(0, 1000); // Limiter la longueur
};

// Créateur de validateurs personnalisés
export const createValidator = <T>(
  rules: Array<(value: T) => string | null>
): Validator<T> => {
  return (value: T): ValidationResult => {
    const errors: string[] = [];

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
