import { useCallback, useState } from 'react';
import { logger } from '../utils/logger';
import type { ApiResponse } from '../types/utils';

export interface ErrorState {
  hasError: boolean;
  error: Error | null;
  errorMessage: string;
  retryCount: number;
}

export interface ErrorHandlerOptions {
  maxRetries?: number;
  retryDelay?: number;
  showAlert?: boolean;
  logErrors?: boolean;
  fallbackMessage?: string;
}

export interface UseErrorHandlerReturn {
  errorState: ErrorState;
  handleError: (error: unknown, context?: string) => void;
  clearError: () => void;
  withErrorHandling: <T>(
    operation: () => Promise<T>,
    options?: ErrorHandlerOptions
  ) => Promise<T | null>;
  retry: (operation: () => Promise<any>) => Promise<any>;
}

/**
 * Hook unifié pour la gestion d'erreurs avec retry automatique
 */
export const useErrorHandler = (
  defaultOptions: ErrorHandlerOptions = {}
): UseErrorHandlerReturn => {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    errorMessage: '',
    retryCount: 0,
  });

  const clearError = useCallback((): void => {
    setErrorState({
      hasError: false,
      error: null,
      errorMessage: '',
      retryCount: 0,
    });
  }, []);

  const handleError = useCallback((error: unknown, context?: string) => {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const message = errorObj.message || 'Une erreur inattendue s\'est produite';

    logger.error(`Error handled: ${message}`, {
      component: 'useErrorHandler',
      context,
      error: errorObj.stack,
    });

    setErrorState({
      hasError: true,
      error: errorObj,
      errorMessage: message,
      retryCount: 0,
    });

    // Note: Alert removed to avoid TypeScript type inference issues
    // Error logging is still active via logger
  }, []);

  const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

  const withErrorHandling = useCallback(async <T,>(
    operation: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> => {
    const opts = { ...defaultOptions, ...options };
    const maxRetries = opts.maxRetries ?? 3;
    const retryDelay = opts.retryDelay ?? 1000;

    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setErrorState(prev => ({ ...prev, retryCount: attempt }));

        const result = await operation();

        // Succès - réinitialiser l'état d'erreur
        if (attempt > 0) {
          clearError();
        }

        return result;
      } catch (error) {
        lastError = error;

        logger.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries + 1})`, {
          component: 'useErrorHandler',
          error: error instanceof Error ? error.message : String(error),
        });

        // Ne pas retry pour la dernière tentative
        if (attempt < maxRetries) {
          await sleep(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    // Toutes les tentatives ont échoué
    handleError(lastError, 'withErrorHandling');
    return null;
  }, [defaultOptions, handleError, clearError]);

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
 */
export const useApiErrorHandler = () => {
  const errorHandler = useErrorHandler({
    maxRetries: 2,
    showAlert: true,
    logErrors: true,
  });

  const handleApiResponse = useCallback(<T,>(
    response: ApiResponse<T>,
    context?: string
  ): T | null => {
    if (!response.success) {
      errorHandler.handleError(new Error(response.error), context);
      return null;
    }
    return response.data;
  }, [errorHandler]);

  const wrapApiCall = useCallback(<T,>(
    apiCall: () => Promise<ApiResponse<T>>,
    _context?: string
  ): Promise<T | null> => {
    return errorHandler.withErrorHandling(async () => {
      const response = await apiCall();
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    }, { maxRetries: 1 });
  }, [errorHandler]);

  return {
    ...errorHandler,
    handleApiResponse,
    wrapApiCall,
  };
};

/**
 * Hook pour les erreurs de formulaire
 */
export const useFormErrorHandler = () => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const setFieldError = useCallback((field: string, message: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  return {
    fieldErrors,
    setFieldError,
    clearFieldError,
    clearAllFieldErrors,
    hasFieldErrors,
  };
};
