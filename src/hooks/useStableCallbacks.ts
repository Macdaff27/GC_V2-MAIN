import { useRef } from 'react';

/**
 * Hook pour stabiliser les callbacks et éviter les re-renders inutiles
 * Utilise useRef pour maintenir des références stables aux fonctions
 */
export const useStableCallbacks = <T extends Record<string, (...args: any[]) => any>>(
  callbacks: T
): T => {
  const callbacksRef = useRef<T>(callbacks);

  // Met à jour la référence à chaque render
  callbacksRef.current = callbacks;

  // Retourne des callbacks stables qui utilisent la référence actuelle
  const stableCallbacks = {} as T;
  Object.keys(callbacks).forEach((key) => {
    (stableCallbacks as any)[key] = (...args: any[]) => {
      return callbacksRef.current[key as keyof T](...args);
    };
  });

  return stableCallbacks;
};
