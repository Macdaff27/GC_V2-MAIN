# Plan de refactoring Phase 2 - Architecture modulaire

**Version** : 2.0 (Preparation 2025-10-07)  
**Source** : context.md + Phase 1 stable

## Objectif
Alleger App.tsx (~1894 -> 150 lignes).  
Extraire les modales, hooks et navigation.

## Etat actuel
- App.tsx : 1894 lignes
- 7 composants extraits
- Logique SQLite : src/hooks/useDatabase.ts

## Structure cible
```
src/
  components/[...]
  screens/[...]
  hooks/[...]
  navigation/[...]
  db/
    dbClient.ts
    clientRepo.ts
    schema.sql
App.tsx (150 lignes)
```

## Etapes proposees
1. Extraction modales  
2. Creation hooks (useClients, useDataTransfer)  
3. Separation DB  
4. Migration React Navigation  
5. Tests + stabilisation
