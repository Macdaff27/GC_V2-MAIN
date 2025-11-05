/**
 * Importations React et dépendances pour useSmartScroll
 */
import { useCallback, useEffect, useRef } from 'react';
// Importations des composants React Native pour la gestion du scroll
import { FlatList, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
// Importations des types TypeScript
import type { ClientWithRelations, StatusFilter } from '../types';

/**
 * Interface définissant les paramètres du hook useSmartScroll
 * Le hook a besoin de toutes les listes de clients et des contrôles de filtrage
 */
export interface UseSmartScrollParams {
  clients: ClientWithRelations[]; // Liste complète des clients
  filteredClients: ClientWithRelations[]; // Clients après tous les filtres
  searchFilteredClients: ClientWithRelations[]; // Clients après filtrage recherche
  searchQuery: string; // Texte de recherche actuel
  statusFilter: StatusFilter; // Filtre de statut actuel
  setSearchQuery: (query: string) => void; // Fonction pour modifier la recherche
  setStatusFilter: (filter: StatusFilter) => void; // Fonction pour modifier le filtre
}

/**
 * Interface définissant le retour du hook useSmartScroll
 * Fournit les références et gestionnaires pour contrôler le scroll intelligent
 */
export interface UseSmartScrollReturn {
  // Références React pour accéder aux éléments DOM/FlatList
  listRef: React.RefObject<FlatList<ClientWithRelations> | null>; // Référence à la FlatList
  pendingScrollClientIdRef: React.MutableRefObject<number | null>; // ID du client à scroller
  lastScrollOffsetRef: React.MutableRefObject<number>; // Dernier offset de scroll
  shouldRestoreScrollRef: React.MutableRefObject<boolean>; // Flag de restauration du scroll

  // Gestionnaires d'événements
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void; // Gestionnaire de scroll
  scrollToClient: (clientId: number) => void; // Déclencheur de scroll vers un client
  setPendingScrollClientId: (id: number | null) => void; // Définit l'ID de scroll en attente
  setShouldRestoreScroll: (restore: boolean) => void; // Active/désactive la restauration du scroll
}

/**
 * Hook personnalisé useSmartScroll - Gestion intelligente du scroll dans les listes
 * Gère le scroll différé, la restauration de position et l'adaptation aux filtres
 * Optimise l'expérience utilisateur lors des modifications de données
 */
export const useSmartScroll = ({
  clients,
  filteredClients,
  searchFilteredClients,
  searchQuery,
  statusFilter,
  setSearchQuery,
  setStatusFilter,
}: UseSmartScrollParams): UseSmartScrollReturn => {
  // Références pour gérer l'état du scroll
  const listRef = useRef<FlatList<ClientWithRelations> | null>(null); // Référence à la FlatList
  const pendingScrollClientIdRef = useRef<number | null>(null); // ID du client à scroller (différé)
  const lastScrollOffsetRef = useRef(0); // Dernière position de scroll connue
  const shouldRestoreScrollRef = useRef(false); // Flag pour restaurer le scroll

  /**
   * Gestionnaire d'événement de scroll
   * Capture et mémorise la position actuelle pour restauration future
   */
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // On mémorise l'offset du scroll pour pouvoir restaurer exactement la même zone visible après une mutation.
    lastScrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  /**
   * Déclencheur de scroll vers un client spécifique
   * Met en attente le scroll (différé) pour éviter les conflits
   */
  const scrollToClient = useCallback((clientId: number) => {
    pendingScrollClientIdRef.current = clientId;
  }, []);

  /**
   * Setter pour l'ID de scroll en attente
   * Utilisé par les composants externes pour contrôler le scroll
   */
  const setPendingScrollClientId = useCallback((id: number | null) => {
    pendingScrollClientIdRef.current = id;
  }, []);

  /**
   * Setter pour le flag de restauration du scroll
   * Active/désactive la restauration automatique de la position
   */
  const setShouldRestoreScroll = useCallback((restore: boolean) => {
    shouldRestoreScrollRef.current = restore;
  }, []);

  /**
   * Effet principal : Gestion des scrolls différés vers un client spécifique
   * Cherche le client dans différentes listes et ajuste les filtres si nécessaire
   * Utilise requestAnimationFrame pour éviter les conflits de rendu
   */
  useEffect(() => {
    const targetId = pendingScrollClientIdRef.current;
    if (!targetId) {
      return; // Pas de scroll en attente
    }

    // On annule les scrolls différés si une restauration d'offset ou une recherche est en cours pour éviter les courses.
    if (shouldRestoreScrollRef.current) {
      console.log('[SCROLL]', 'Scroll différé annulé : restauration prioritaire.');
      pendingScrollClientIdRef.current = null;
      return;
    }

    if (searchQuery.trim().length > 0) {
      console.log('[SEARCH]', `Scroll différé annulé pendant la recherche (id=${targetId}).`);
      pendingScrollClientIdRef.current = null;
      return;
    }

    // Stratégie 1 : Chercher dans la liste filtrée finale (cas idéal)
    const indexInFiltered = filteredClients.findIndex((client) => client.id === targetId);
    if (indexInFiltered !== -1) {
      requestAnimationFrame(() => {
        if (!listRef.current) {
          pendingScrollClientIdRef.current = null;
          return;
        }
        try {
          // Scroll animé vers l'index trouvé (position 10% du haut de l'écran)
          listRef.current.scrollToIndex({
            index: indexInFiltered,
            animated: true,
            viewPosition: 0.1, // 10% du haut de l'écran
          });
          console.log('[SCROLL]', `scrollToIndex réussi pour ${targetId} (index ${indexInFiltered}).`);
        } catch (error) {
          console.log('[SCROLL]', `scrollToIndex échoué pour ${targetId}.`, error);
        } finally {
          // Nettoyer le scroll en attente
          pendingScrollClientIdRef.current = null;
        }
      });
      return;
    }

    // Stratégie 2 : Le client existe mais est filtré - ajuster les filtres
    const indexInSearchFiltered = searchFilteredClients.findIndex((client) => client.id === targetId);
    if (indexInSearchFiltered !== -1 && statusFilter !== 'all') {
      // Désactiver le filtre de statut pour rendre le client visible
      setStatusFilter('all');
      return; // L'effet se relancera avec les nouveaux filtres
    }

    // Stratégie 3 : Le client existe mais les filtres le masquent - reset complet
    const indexInAllClients = clients.findIndex((client) => client.id === targetId);
    if (indexInAllClients !== -1) {
      let didAdjust = false;
      // Reset de la recherche si active
      if (searchQuery !== '') {
        setSearchQuery('');
        didAdjust = true;
      }
      // Reset du filtre de statut si actif
      if (statusFilter !== 'all') {
        setStatusFilter('all');
        didAdjust = true;
      }
      if (didAdjust) {
        return; // L'effet se relancera avec les nouveaux filtres
      }
    }

    // Échec : client introuvable ou supprimé
    pendingScrollClientIdRef.current = null;
  }, [clients, filteredClients, searchFilteredClients, searchQuery, setSearchQuery, setStatusFilter, statusFilter]);

  /**
   * Effet secondaire : Annulation des scrolls différés pendant la recherche
   * Évite les crashes dus aux datasets mouvants pendant la frappe
   */
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      return; // Pas de recherche active
    }
    if (pendingScrollClientIdRef.current === null) {
      return; // Pas de scroll en attente
    }
    // On neutralise les scrolls différés dès qu'une recherche démarre pour éviter les crashes liés aux datasets mouvants.
    console.log('[SEARCH]', 'Scroll différé abandonné car une recherche est active.');
    pendingScrollClientIdRef.current = null;
  }, [searchQuery]);

  /**
   * Effet tertiaire : Restauration de l'offset de scroll après modifications
   * Maintient la position visuelle lors d'ajouts/suppressions de clients
   */
  useEffect(() => {
    if (!shouldRestoreScrollRef.current) {
      return; // Restauration non demandée
    }

    const targetOffset = lastScrollOffsetRef.current;
    requestAnimationFrame(() => {
      // On restaure sans animation pour ne pas provoquer de mouvement perceptible après ajout/suppression.
      try {
        listRef.current?.scrollToOffset({
          offset: targetOffset,
          animated: false // Restauration discrète
        });
        console.log('[SCROLL]', `Offset restauré à ${targetOffset}.`);
      } catch (error) {
        console.log('[SCROLL]', 'Restauration offset impossible pour le moment.', error);
      } finally {
        // Désactiver le flag de restauration
        shouldRestoreScrollRef.current = false;
      }
    });
  }, [filteredClients]); // Se déclenche quand la liste filtrée change

  return {
    // Refs
    listRef,
    pendingScrollClientIdRef,
    lastScrollOffsetRef,
    shouldRestoreScrollRef,

    // Handlers
    handleScroll,
    scrollToClient,
    setPendingScrollClientId,
    setShouldRestoreScroll,
  };
};
