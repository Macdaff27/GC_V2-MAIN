/**
 * Importations React pour useStableCallbacks
 */
import { useRef } from 'react';

/**
 * Hook personnalisé useStableCallbacks - Stabilisation des callbacks pour optimiser les performances
 *
 * Problème résolu :
 * En React, quand des callbacks sont recréés à chaque render, ils provoquent des re-renders
 * inutiles des composants enfants qui les utilisent comme dépendances.
 *
 * Solution :
 * Ce hook retourne des callbacks stables (même référence) qui pointent toujours vers
 * la version la plus récente des fonctions originales, évitant ainsi les re-renders en cascade.
 *
 * @template T - Type générique pour l'objet de callbacks
 * @param callbacks - Objet contenant les fonctions à stabiliser
 * @returns Objet avec les mêmes callbacks mais des références stables
 */
export const useStableCallbacks = <T extends Record<string, (...args: any[]) => any>>(
  callbacks: T
): T => {
  // Référence mutable pour stocker la version la plus récente des callbacks
  const callbacksRef = useRef<T>(callbacks);

  // Met à jour la référence à chaque render avec les nouvelles fonctions
  // Cela permet aux callbacks stables d'accéder aux dernières versions
  callbacksRef.current = callbacks;

  // Création d'un nouvel objet avec des callbacks stables
  const stableCallbacks = {} as T;

  // Pour chaque callback original, créer une version stable
  Object.keys(callbacks).forEach((key) => {
    // La fonction stable utilise toujours la référence actuelle (callbacksRef.current)
    // Cela signifie qu'elle appellera toujours la version la plus récente de la fonction
    (stableCallbacks as any)[key] = (...args: any[]) => {
      return callbacksRef.current[key as keyof T](...args);
    };
  });

  // Retourner l'objet avec les callbacks stabilisés
  return stableCallbacks;
};
