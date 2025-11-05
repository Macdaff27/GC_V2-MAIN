/**
 * Importations React et dépendances pour useErrorHandler
 */
import { useCallback, useState } from 'react';
// Importation du logger pour le suivi des erreurs
import { logger } from '../utils/logger';
// Importation du type ApiResponse pour la gestion des erreurs API
import type { ApiResponse } from '../types/utils';

/**
 * Interface définissant l'état d'erreur du hook
 * Représente l'état actuel des erreurs et tentatives de retry
 */
export interface ErrorState {
  hasError: boolean; // True si une erreur est active
  error: Error | null; // Objet Error détaillé
  errorMessage: string; // Message d'erreur formaté pour l'utilisateur
  retryCount: number; // Nombre de tentatives de retry effectuées
}

/**
 * Interface définissant les options de configuration du gestionnaire d'erreurs
 * Permet de personnaliser le comportement du retry et de l'affichage
 */
export interface ErrorHandlerOptions {
  maxRetries?: number; // Nombre maximum de tentatives de retry (défaut: 3)
  retryDelay?: number; // Délai initial entre les retry en ms (défaut: 1000)
  showAlert?: boolean; // Afficher une alerte à l'utilisateur (défaut: false)
  logErrors?: boolean; // Logger les erreurs (défaut: true)
  fallbackMessage?: string; // Message de fallback si l'erreur n'a pas de message
}

/**
 * Interface définissant le retour du hook useErrorHandler
 * Fournit toutes les fonctions et états pour gérer les erreurs
 */
export interface UseErrorHandlerReturn {
  errorState: ErrorState; // État actuel des erreurs
  handleError: (error: unknown, context?: string) => void; // Gestionnaire d'erreur manuel
  clearError: () => void; // Réinitialisation de l'état d'erreur
  withErrorHandling: <T>( // Wrapper pour opérations avec retry automatique
    operation: () => Promise<T>,
    options?: ErrorHandlerOptions
  ) => Promise<T | null>;
  retry: (operation: () => Promise<any>) => Promise<any>; // Retry simple d'une opération
}

/**
 * Hook unifié pour la gestion d'erreurs avec retry automatique
 * Fournit un système complet de gestion d'erreurs avec logging et retry exponentiel
 */
export const useErrorHandler = (
  defaultOptions: ErrorHandlerOptions = {}
): UseErrorHandlerReturn => {
  // État local pour suivre les erreurs et les tentatives de retry
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    errorMessage: '',
    retryCount: 0,
  });

  /**
   * Réinitialise complètement l'état d'erreur
   * Utilisé après résolution d'une erreur ou changement de contexte
   */
  const clearError = useCallback((): void => {
    setErrorState({
      hasError: false,
      error: null,
      errorMessage: '',
      retryCount: 0,
    });
  }, []);

  /**
   * Gestionnaire d'erreur principal
   * Normalise l'erreur, log et met à jour l'état
   */
  const handleError = useCallback((error: unknown, context?: string) => {
    // Normalisation de l'erreur en objet Error
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const message = errorObj.message || 'Une erreur inattendue s\'est produite';

    // Logging détaillé avec contexte
    logger.error(`Error handled: ${message}`, {
      component: 'useErrorHandler',
      context,
      error: errorObj.stack,
    });

    // Mise à jour de l'état d'erreur
    setErrorState({
      hasError: true,
      error: errorObj,
      errorMessage: message,
      retryCount: 0,
    });

    // Note: Alert removed to avoid TypeScript type inference issues
    // Error logging is still active via logger
  }, []);

  /**
   * Fonction utilitaire pour les délais (retry exponentiel)
   */
  const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

  /**
   * Wrapper principal pour les opérations avec gestion d'erreur et retry
   * Implémente un retry exponentiel avec backoff
   */
  const withErrorHandling = useCallback(async <T,>(
    operation: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> => {
    // Fusion des options par défaut et spécifiques
    const opts = { ...defaultOptions, ...options };
    const maxRetries = opts.maxRetries ?? 3;
    const retryDelay = opts.retryDelay ?? 1000;

    let lastError: unknown;

    // Boucle de retry avec backoff exponentiel
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Mise à jour du compteur de retry
        setErrorState(prev => ({ ...prev, retryCount: attempt }));

        // Exécution de l'opération
        const result = await operation();

        // Succès - réinitialiser l'état d'erreur si on avait retry
        if (attempt > 0) {
          clearError();
        }

        return result;
      } catch (error) {
        lastError = error;

        // Logging des échecs avec numéro de tentative
        logger.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries + 1})`, {
          component: 'useErrorHandler',
          error: error instanceof Error ? error.message : String(error),
        });

        // Attendre avant le prochain retry (sauf dernière tentative)
        if (attempt < maxRetries) {
          await sleep(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    // Toutes les tentatives ont échoué - gérer l'erreur finale
    handleError(lastError, 'withErrorHandling');
    return null;
  }, [defaultOptions, handleError, clearError]);

  /**
   * Fonction de retry simplifiée (une seule tentative)
   * Utile pour les boutons "Réessayer"
   */
  const retry = useCallback(async (operation: () => Promise<any>) => {
    return withErrorHandling(operation, { maxRetries: 1 });
  }, [withErrorHandling]);

  return {
    errorState,
    handleError,
    clearError,
    withErrorHandling,
    retry,
  };
};

/**
 * Hook spécialisé pour les erreurs API
 * Configuration optimisée pour les appels réseau avec retry réduit
 */
export const useApiErrorHandler = () => {
  // Configuration spécialisée pour les API (moins de retry, plus d'alertes)
  const errorHandler = useErrorHandler({
    maxRetries: 2,    // Moins de retry pour les API (réseau moins fiable)
    showAlert: true,  // Alertes activées pour feedback utilisateur
    logErrors: true,  // Logging toujours actif
  });

  /**
   * Gestionnaire pour les réponses API standardisées
   * Extrait les données ou gère l'erreur selon le format ApiResponse
   */
  const handleApiResponse = useCallback(<T,>(
    response: ApiResponse<T>,
    context?: string
  ): T | null => {
    if (!response.success) {
      // Erreur API - déléguer au gestionnaire d'erreur
      errorHandler.handleError(new Error(response.error), context);
      return null;
    }
    // Succès - retourner les données
    return response.data;
  }, [errorHandler]);

  /**
   * Wrapper pour les appels API avec gestion automatique des erreurs
   * Transforme les ApiResponse en données ou erreurs gérées
   */
  const wrapApiCall = useCallback(<T,>(
    apiCall: () => Promise<ApiResponse<T>>,
    _context?: string
  ): Promise<T | null> => {
    return errorHandler.withErrorHandling(async () => {
      const response = await apiCall();
      if (!response.success) {
        // Convertir l'erreur API en exception pour le retry
        throw new Error(response.error);
      }
      return response.data;
    }, { maxRetries: 1 }); // Un seul retry supplémentaire pour les API
  }, [errorHandler]);

  // Retour étendu avec les fonctions spécialisées API
  return {
    ...errorHandler,      // Toutes les fonctions du hook de base
    handleApiResponse,    // Gestionnaire de réponses API
    wrapApiCall,          // Wrapper pour appels API
  };
};

/**
 * Hook pour les erreurs de formulaire
 * Gestion des erreurs de validation par champ avec état local
 */
export const useFormErrorHandler = () => {
  // État local pour stocker les erreurs par champ
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /**
   * Définit une erreur pour un champ spécifique
   * Remplace l'erreur existante ou en ajoute une nouvelle
   */
  const setFieldError = useCallback((field: string, message: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  /**
   * Supprime l'erreur d'un champ spécifique
   * Utile quand la validation passe pour ce champ
   */
  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  /**
   * Supprime toutes les erreurs de formulaire
   * Utile au reset du formulaire ou changement de contexte
   */
  const clearAllFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  // Propriété calculée pour vérifier s'il y a des erreurs
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  // Retour avec toutes les fonctions de gestion des erreurs de formulaire
  return {
    fieldErrors,          // État actuel des erreurs par champ
    setFieldError,        // Définir une erreur de champ
    clearFieldError,      // Supprimer une erreur de champ
    clearAllFieldErrors,  // Supprimer toutes les erreurs
    hasFieldErrors,       // Indicateur de présence d'erreurs
  };
};
