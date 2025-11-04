import { renderHook, act } from '@testing-library/react-native';
import { useClientFilters } from './useClientFilters';

const mockClients = [
  {
    id: 1,
    nom: 'Alice Dupont',
    page: 10,
    note: 'Client VIP',
    montantTotal: 50000,
    montantRestant: 25000,
    dateAjout: '2024-01-15',
    statut: true,
    frais: [],
    telephones: [{ numero: '0555123456', id: 1 }],
  },
  {
    id: 2,
    nom: 'Bob Martin',
    page: 25,
    note: 'Client régulier',
    montantTotal: 30000,
    montantRestant: 30000,
    dateAjout: '2024-02-01',
    statut: false,
    frais: [],
    telephones: [{ numero: '0556789012', id: 2 }],
  },
];

describe('useClientFilters', () => {
  it('should filter clients by search query', () => {
    const { result } = renderHook(() => useClientFilters({ clients: mockClients }));

    // Recherche par nom
    act(() => {
      result.current.setSearchQuery('Alice');
    });

    expect(result.current.filteredClients).toHaveLength(1);
    expect(result.current.filteredClients[0].nom).toBe('Alice Dupont');

    // Recherche par numéro de page
    act(() => {
      result.current.setSearchQuery('25');
    });

    expect(result.current.filteredClients).toHaveLength(1);
    expect(result.current.filteredClients[0].nom).toBe('Bob Martin');
  });

  it('should filter clients by status', () => {
    const { result } = renderHook(() => useClientFilters({ clients: mockClients }));

    // Filtrer les clients terminés
    act(() => {
      result.current.setStatusFilter('done');
    });

    expect(result.current.filteredClients).toHaveLength(1);
    expect(result.current.filteredClients[0].statut).toBe(true);

    // Filtrer les clients en cours
    act(() => {
      result.current.setStatusFilter('in-progress');
    });

    expect(result.current.filteredClients).toHaveLength(1);
    expect(result.current.filteredClients[0].statut).toBe(false);
  });

  it('should sort clients by page number', () => {
    const { result } = renderHook(() => useClientFilters({ clients: mockClients }));

    // Tri croissant (par défaut)
    expect(result.current.filteredClients[0].page).toBe(10);
    expect(result.current.filteredClients[1].page).toBe(25);

    // Tri décroissant
    act(() => {
      result.current.setIsSortAscending(false);
    });

    expect(result.current.filteredClients[0].page).toBe(25);
    expect(result.current.filteredClients[1].page).toBe(10);
  });

  it('should return correct status counts', () => {
    const { result } = renderHook(() => useClientFilters({ clients: mockClients }));

    expect(result.current.statusCounts).toEqual({
      total: 2,
      inProgress: 1,
      done: 1,
    });
  });

  it('should combine search and status filters', () => {
    const { result } = renderHook(() => useClientFilters({ clients: mockClients }));

    // Recherche + filtre statut
    act(() => {
      result.current.setSearchQuery('Alice');
      result.current.setStatusFilter('done');
    });

    expect(result.current.filteredClients).toHaveLength(1);
    expect(result.current.filteredClients[0].nom).toBe('Alice Dupont');
  });
});
