/**
 * Importations React et types pour useClientFilters
 */
import { useMemo, useState } from 'react';
// Importation du type ClientWithRelations pour le typage
import type { ClientWithRelations } from '../types';

/**
 * Type définissant les filtres de statut disponibles
 * 'all' = tous les clients, 'in-progress' = en cours, 'done' = terminés
 */
export type StatusFilter = 'all' | 'in-progress' | 'done';

/**
 * Interface définissant les compteurs par statut
 * Utilisée pour afficher les statistiques dans l'interface
 */
export interface StatusCounts {
  total: number; // Nombre total de clients (après filtrage recherche)
  inProgress: number; // Nombre de clients en cours
  done: number; // Nombre de clients terminés
}

/**
 * Interface définissant les paramètres du hook useClientFilters
 * Le hook a besoin de la liste complète des clients pour appliquer les filtres
 */
export interface UseClientFiltersParams {
  clients: ClientWithRelations[]; // Liste complète des clients à filtrer
}

/**
 * Interface définissant le retour du hook useClientFilters
 * Fournit tous les états, valeurs calculées et fonctions de contrôle des filtres
 */
export interface UseClientFiltersReturn {
  // États contrôlables par l'utilisateur
  searchQuery: string; // Texte de recherche actuel
  statusFilter: StatusFilter; // Filtre de statut sélectionné
  isSortAscending: boolean; // Direction du tri (true = croissant, false = décroissant)

  // Valeurs calculées (résultats des filtres)
  searchFilteredClients: ClientWithRelations[]; // Clients après filtrage recherche
  statusCounts: StatusCounts; // Comptages par statut des clients filtrés
  filteredClients: ClientWithRelations[]; // Clients finaux (recherche + statut + tri)
  filteredClientsCount: number; // Nombre de clients dans la liste finale

  // Gestionnaires pour modifier les filtres
  setSearchQuery: (query: string) => void; // Modifier le texte de recherche
  setStatusFilter: (filter: StatusFilter) => void; // Changer le filtre de statut
  setIsSortAscending: (ascending: boolean) => void; // Inverser le tri
}

/**
 * Hook personnalisé useClientFilters - Gestion des filtres et tris des clients
 * Applique successivement : recherche textuelle → filtrage par statut → tri par page
 * Optimise les performances avec useMemo pour éviter les recalculs inutiles
 */
export const useClientFilters = ({
  clients,
}: UseClientFiltersParams): UseClientFiltersReturn => {
  // États locaux pour les critères de filtrage
  const [searchQuery, setSearchQuery] = useState(''); // Texte de recherche
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all'); // Filtre de statut
  const [isSortAscending, setIsSortAscending] = useState(true); // Direction du tri

  /**
   * Première étape : filtrage par recherche textuelle
   * Recherche dans le nom, la page et les notes des clients
   */
  const searchFilteredClients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // Si pas de recherche, retourner tous les clients
    if (!query) {
      return clients;
    }

    // Filtrer les clients dont le nom, la page ou les notes contiennent la recherche
    return clients.filter((client) => {
      const note = client.note?.toLowerCase();
      return (
        client.nom.toLowerCase().includes(query) ||
        client.page.toString().includes(query) ||
        (note ? note.includes(query) : false)
      );
    });
  }, [clients, searchQuery]);

  /**
   * Deuxième étape : calcul des compteurs par statut
   * Comptage des clients après filtrage recherche pour l'affichage des statistiques
   */
  const statusCounts = useMemo(() => {
    let inProgress = 0;
    let done = 0;

    // Parcourir les clients filtrés par recherche
    for (const client of searchFilteredClients) {
      if (client.statut) {
        done += 1; // Client terminé
      } else {
        inProgress += 1; // Client en cours
      }
    }

    return {
      total: searchFilteredClients.length, // Total après recherche
      inProgress, // Nombre en cours
      done, // Nombre terminés
    };
  }, [searchFilteredClients]);

  /**
   * Troisième étape : filtrage final avec tri
   * Applique le filtre de statut puis le tri par numéro de page
   */
  const filteredClients = useMemo(() => {
    // Appliquer le filtre de statut
    const baseList =
      statusFilter === 'all'
        ? searchFilteredClients // Tous les clients filtrés par recherche
        : searchFilteredClients.filter((client) =>
            statusFilter === 'done' ? client.statut : !client.statut, // Terminés ou en cours
          );

    // Appliquer le tri par numéro de page
    const sortedList = [...baseList].sort((a, b) => {
      if (isSortAscending) {
        return a.page - b.page; // Tri croissant
      }
      return b.page - a.page; // Tri décroissant
    });

    return sortedList;
  }, [isSortAscending, searchFilteredClients, statusFilter]);

  // Retour du hook avec tous les états et valeurs calculées
  return {
    // États bruts (valeurs contrôlées par l'utilisateur)
    searchQuery, // Texte de recherche actuel
    statusFilter, // Filtre de statut sélectionné
    isSortAscending, // Direction du tri

    // Valeurs intermédiaires (utiles pour d'autres composants comme Stats)
    searchFilteredClients, // Clients après filtrage recherche uniquement
    statusCounts, // Statistiques par statut (pour les boutons)

    // Valeur finale (résultat complet de tous les filtres)
    filteredClients, // Liste finale triée et filtrée
    filteredClientsCount: filteredClients.length, // Nombre d'éléments dans la liste finale

    // Gestionnaires pour modifier les filtres
    setSearchQuery, // Modifier la recherche
    setStatusFilter, // Changer le filtre de statut
    setIsSortAscending, // Inverser le sens du tri
  };
};
