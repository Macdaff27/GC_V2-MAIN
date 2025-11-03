import { useCallback, useEffect, useRef } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import type { ClientWithRelations, StatusFilter } from '../types';

export interface UseSmartScrollParams {
  clients: ClientWithRelations[];
  filteredClients: ClientWithRelations[];
  searchFilteredClients: ClientWithRelations[];
  searchQuery: string;
  statusFilter: StatusFilter;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: StatusFilter) => void;
}

export interface UseSmartScrollReturn {
  // Refs
  listRef: React.RefObject<FlatList<ClientWithRelations> | null>;
  pendingScrollClientIdRef: React.MutableRefObject<number | null>;
  lastScrollOffsetRef: React.MutableRefObject<number>;
  shouldRestoreScrollRef: React.MutableRefObject<boolean>;

  // Handlers
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollToClient: (clientId: number) => void;
  setPendingScrollClientId: (id: number | null) => void;
  setShouldRestoreScroll: (restore: boolean) => void;
}

export const useSmartScroll = ({
  clients,
  filteredClients,
  searchFilteredClients,
  searchQuery,
  statusFilter,
  setSearchQuery,
  setStatusFilter,
}: UseSmartScrollParams): UseSmartScrollReturn => {
  const listRef = useRef<FlatList<ClientWithRelations> | null>(null);
  const pendingScrollClientIdRef = useRef<number | null>(null);
  const lastScrollOffsetRef = useRef(0);
  const shouldRestoreScrollRef = useRef(false);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // On memorise l'offset du scroll pour pouvoir restaurer exactement la meme zone visible apres une mutation.
    lastScrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const scrollToClient = useCallback((clientId: number) => {
    pendingScrollClientIdRef.current = clientId;
  }, []);

  const setPendingScrollClientId = useCallback((id: number | null) => {
    pendingScrollClientIdRef.current = id;
  }, []);

  const setShouldRestoreScroll = useCallback((restore: boolean) => {
    shouldRestoreScrollRef.current = restore;
  }, []);

  // Gestion des scrolls différés
  useEffect(() => {
    const targetId = pendingScrollClientIdRef.current;
    if (!targetId) {
      return;
    }

    // On annule les scrolls differes si une restauration d'offset ou une recherche est en cours pour eviter les courses.
    if (shouldRestoreScrollRef.current) {
      console.log('[SCROLL]', 'Scroll differe annule : restauration prioritaire.');
      pendingScrollClientIdRef.current = null;
      return;
    }

    if (searchQuery.trim().length > 0) {
      console.log('[SEARCH]', `Scroll differe annule pendant la recherche (id=${targetId}).`);
      pendingScrollClientIdRef.current = null;
      return;
    }

    const indexInFiltered = filteredClients.findIndex((client) => client.id === targetId);
    if (indexInFiltered !== -1) {
      requestAnimationFrame(() => {
        if (!listRef.current) {
          pendingScrollClientIdRef.current = null;
          return;
        }
        try {
          listRef.current.scrollToIndex({
            index: indexInFiltered,
            animated: true,
            viewPosition: 0.1,
          });
          console.log('[SCROLL]', `scrollToIndex reussi pour ${targetId} (index ${indexInFiltered}).`);
        } catch (error) {
          console.log('[SCROLL]', `scrollToIndex echoue pour ${targetId}.`, error);
        } finally {
          pendingScrollClientIdRef.current = null;
        }
      });
      return;
    }

    const indexInSearchFiltered = searchFilteredClients.findIndex((client) => client.id === targetId);
    if (indexInSearchFiltered !== -1 && statusFilter !== 'all') {
      setStatusFilter('all');
      return;
    }

    const indexInAllClients = clients.findIndex((client) => client.id === targetId);
    if (indexInAllClients !== -1) {
      let didAdjust = false;
      if (searchQuery !== '') {
        setSearchQuery('');
        didAdjust = true;
      }
      if (statusFilter !== 'all') {
        setStatusFilter('all');
        didAdjust = true;
      }
      if (didAdjust) {
        return;
      }
    }

    pendingScrollClientIdRef.current = null;
  }, [clients, filteredClients, searchFilteredClients, searchQuery, setSearchQuery, setStatusFilter, statusFilter]);

  // Gestion des scrolls pendant la recherche
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      return;
    }
    if (pendingScrollClientIdRef.current === null) {
      return;
    }
    // On neutralise les scrolls differes des qu'une recherche demarre pour eviter les crashs lies aux datasets mouvants.
    console.log('[SEARCH]', 'Scroll differe abandonne car une recherche est active.');
    pendingScrollClientIdRef.current = null;
  }, [searchQuery]);

  // Restauration de l'offset de scroll
  useEffect(() => {
    if (!shouldRestoreScrollRef.current) {
      return;
    }

    const targetOffset = lastScrollOffsetRef.current;
    requestAnimationFrame(() => {
      // On restaure sans animation pour ne pas provoquer de mouvement perceptible apres ajout/suppression.
      try {
        listRef.current?.scrollToOffset({ offset: targetOffset, animated: false });
        console.log('[SCROLL]', `Offset restaure a ${targetOffset}.`);
      } catch (error) {
        console.log('[SCROLL]', 'Restauration offset impossible pour le moment.', error);
      } finally {
        shouldRestoreScrollRef.current = false;
      }
    });
  }, [filteredClients]);

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
