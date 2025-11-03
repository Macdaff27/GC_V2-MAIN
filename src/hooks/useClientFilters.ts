import { useMemo, useState } from 'react';
import type { ClientWithRelations } from '../types';

export type StatusFilter = 'all' | 'in-progress' | 'done';

export interface StatusCounts {
  total: number;
  inProgress: number;
  done: number;
}

export interface UseClientFiltersParams {
  clients: ClientWithRelations[];
}

export interface UseClientFiltersReturn {
  // États
  searchQuery: string;
  statusFilter: StatusFilter;
  isSortAscending: boolean;

  // Computed values
  searchFilteredClients: ClientWithRelations[];
  statusCounts: StatusCounts;
  filteredClients: ClientWithRelations[];

  // Handlers
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: StatusFilter) => void;
  setIsSortAscending: (ascending: boolean) => void;
}

export const useClientFilters = ({
  clients,
}: UseClientFiltersParams): UseClientFiltersReturn => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isSortAscending, setIsSortAscending] = useState(true);

  const searchFilteredClients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return clients;
    }

    return clients.filter((client) => {
      const note = client.note?.toLowerCase();
      return (
        client.nom.toLowerCase().includes(query) ||
        client.page.toString().includes(query) ||
        (note ? note.includes(query) : false)
      );
    });
  }, [clients, searchQuery]);

  const statusCounts = useMemo(() => {
    let inProgress = 0;
    let done = 0;

    for (const client of searchFilteredClients) {
      if (client.statut) {
        done += 1;
      } else {
        inProgress += 1;
      }
    }

    return {
      total: searchFilteredClients.length,
      inProgress,
      done,
    };
  }, [searchFilteredClients]);

  const filteredClients = useMemo(() => {
    const baseList =
      statusFilter === 'all'
        ? searchFilteredClients
        : searchFilteredClients.filter((client) =>
            statusFilter === 'done' ? client.statut : !client.statut,
          );

    const sortedList = [...baseList].sort((a, b) => {
      if (isSortAscending) {
        return a.page - b.page;
      }
      return b.page - a.page;
    });

    return sortedList;
  }, [isSortAscending, searchFilteredClients, statusFilter]);

  return {
    // États
    searchQuery,
    statusFilter,
    isSortAscending,

    // Computed values
    searchFilteredClients,
    statusCounts,
    filteredClients,

    // Handlers
    setSearchQuery,
    setStatusFilter,
    setIsSortAscending,
  };
};
