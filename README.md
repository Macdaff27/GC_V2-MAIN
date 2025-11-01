# Application de Gestion des Clientes - Boutique de Robes

**Version** : 1.2.0 (Phase 1 terminee)  
**Derniere mise a jour** : 2025-10-31

## Description
Application mobile React Native pour gerer les **clientes**, leurs **frais**, **telephones** et **notes**. Fonctionnement hors-ligne avec SQLite. Import/export JSON tolerant plusieurs formats. Interface moderne avec themes clair/sombre.

## Fonctionnalites principales
- CRUD complet sur clientes
- Suivi des montants (total/restant)
- Multi-numeros
- Detail des frais
- Statut commande (en cours/terminee)
- Export JSON / Import JSON
- Recherche nom/page/note
- Theme clair/sombre
- Statistiques filtrables

## Technologies
- **React Native** + **TypeScript**
- **SQLite** via `react-native-quick-sqlite`
- **Fichiers** via `react-native-fs`
- **Selecteur** `@react-native-documents/picker`

## Structure (Phase 1)
```
MonProjet/
  App.tsx               # Orchestrateur principal (~1894 lignes)
  AppText.tsx
  src/
    components/
      ClientCard.tsx
      SearchBar.tsx
      DataActions.tsx
      Stats.tsx
      ThemeToggle.tsx
      SortButton.tsx
    hooks/
      useDatabase.ts
    types/
      index.ts
    utils/
      format.ts
  context.md
  phase2_refactor_plan.md
  package.json
```

## Historique
### Phase 1 (terminee - 2025-10-06)
Extraction de 7 composants et reduction de 2500 -> 1894 lignes.

### Phase 2 (prevue)
- Extraction des modales
- Hooks dedies
- Navigation React Navigation
- Separation DB
