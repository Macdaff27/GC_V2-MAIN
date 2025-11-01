# Contexte du projet - Gestion de clientes (React Native)

## Changelog
- 2025-10-06 : Phase 1 du refactoring terminee. Extraction de 7 composants reussie.
- 2025-10-06 : Correction : `dateAjout` format JJ/MM/AAAA. Import/export fonctionnels.

## Structure actuelle (Phase 1)
```
src/
  components/
    ClientCard.tsx
    SearchBar.tsx
    DataActions.tsx
    Stats.tsx
    ThemeToggle.tsx
    SortButton.tsx
  types/
    index.ts
  utils/
    format.ts
  hooks/
    useDatabase.ts
App.tsx (~1894 lignes)
AppText.tsx
```

**Etat actuel** : App.tsx contient les deux modales complexes et la logique SQLite via `useDatabase.ts`.  
**Phase 1 stable**.
