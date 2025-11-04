# context.md — Contexte Technique & Architecture (v2.0)

## 🎯 Principe Produit (Maintenu)
- App offline‑first pour gérer commandes clientes en boutique
- Interface **"cards‑only"** : tout sur la carte, pas de détails séparés
- **Architecture modulaire avancée** : séparation claire des responsabilités

## 🏗️ Architecture Modulaire (v2.0)

### **Couche Présentation (UI)**
```typescript
App.tsx                     // Orchestrateur léger (200 lignes)
├── AppControls.tsx         // Consolidation contrôles UI
├── ClientCard.tsx          // Carte optimisée (React.memo)
└── FloatingActionButton.tsx // FAB optimisé
```

### **Couche Logique Métier (Hooks)**
```typescript
src/hooks/
├── useAppState.ts          // État global + thème unifié
├── useClientActions.ts     // Actions CRUD centralisées
├── useClientData.ts        // Gestion données + export/import
├── useClientFilters.ts     // Recherche + tri intelligents
├── useSmartScroll.ts       // Scroll optimisé + restauration
├── useDatabase.ts          // Abstraction base de données
├── useErrorHandler.ts      // Gestion erreurs robuste
└── useStableCallbacks.ts   // Callbacks optimisés
```

### **Couche Utilitaires & Types**
```typescript
src/
├── types/
│   ├── index.ts            // Types domaine sécurisés
│   └── utils.ts            // Types avancés (DeepPartial, Branded)
├── utils/
│   ├── format.ts           // Formatage pur
│   ├── validation.ts       // Validation avancée
│   └── logger.ts           // Logging configurable
├── constants/
│   ├── colors.ts           // Palette centralisée
│   └── dimensions.ts       // Espacements + tailles
├── i18n/
│   └── index.ts            // Internationalisation FR/EN/AR
└── config/
    └── bundle.ts           // Optimisations bundle
```

## 🎨 Thème & Palette (v2.0)
- **Palette centralisée** (`src/constants/colors.ts`)
- **Thème automatique** + manuel (`useAppState.ts`)
- **Switch colors** intégrés (trackOn/Off, thumbOn/Off)
- **Lisibilité garantie** : texte adapté aux fonds colorés

## 📥 Import/Export — Règles Avancées
- **Validation complète** avant import (`src/utils/validation.ts`)
- **Remplacement complet** : purge tables puis insertions
- **dateAjout préservée** depuis JSON (JJ/MM/AAAA)
- **Sanitisation** des entrées utilisateur
- **Gestion d'erreurs** robuste avec retry

## 📤 Export — Règles Sécurisées
- **JSON structuré** (indentation 2, métadonnées)
- **Validation** des données exportées
- **Noms de fichiers** uniques avec timestamp
- **Confirmation** avant écrasement

## 🗃️ Données & Contraintes (v2.0)
- **Types branded** pour sécurité (`ClientId`, `Amount`)
- **Validation métier** complète (noms, montants, dates)
- **Contraintes UNIQUE** : `clients.nom`, `clients.page`
- **Cascades** : suppression frais/téléphones
- **Index optimisés** : `idx_frais_client`, `idx_tel_client`

## 🧭 UI "Cards-Only" (Confirmé)
- ✅ **Aucune navigation**, aucune "page de détail"
- ✅ **ClientCard complète** : nom, page, date, statut, montants, frais, téléphones, note, actions
- ✅ **Optimisations React** : `React.memo`, callbacks stables
- ✅ **Performance** : scroll fluide, re-renders minimisés

## 🔐 Sécurité & Fiabilité (v2.0)

### **Validation Robuste**
- **Types TypeScript stricts** (pas de `any`)
- **Validation runtime** complète (formulaires, données)
- **Sanitisation** des entrées (XSS protection)
- **Contraintes métier** (montants positifs, dates valides)

### **Gestion d'Erreurs**
- **Retry automatique** avec backoff exponentiel
- **Logging configurable** (dev/prod)
- **Alertes utilisateur** intelligentes
- **Fallbacks** pour états d'erreur

### **Performance**
- **Bundle optimisé** (< 2MB recommandé)
- **Lazy loading** préparé pour gros composants
- **Tree shaking** des utilitaires
- **Mémorisation** des calculs coûteux

## 🧪 Tests & Qualité (v2.0)

### **Tests Unitaires**
- **Hooks critiques** testés (`useClientFilters.test.ts`)
- **Validation** complète testée
- **Types** vérifiés à la compilation
- **Coverage** des chemins critiques

### **Qualité Code**
- **ESLint strict** : zéro warning
- **TypeScript strict** : types avancés
- **Prettier** : formatage automatique
- **Imports** organisés et optimisés

## 🧩 Extraits Utiles (Architecture v2.0)

### **Hook Modulaire Typique**
```typescript
export const useClientFilters = ({ clients }: UseClientFiltersParams) => {
  // Logique pure, testable, réutilisable
  const filteredClients = useMemo(() => { /* ... */ }, [clients, searchQuery]);
  return { filteredClients, searchQuery, setSearchQuery };
};
```

### **Composant Optimisé**
```tsx
const ClientCard = React.memo<ClientCardProps>(({ client, palette, onEdit }) => {
  // Rendu optimisé, pas de re-render inutile
  return <View style={styles.card}>{/* ... */}</View>;
});
```

### **Validation Robuste**
```typescript
export const validateClientForm = (values: ClientFormValues): ValidationResult => {
  // Validation complète : types, métier, sécurité
  return errors.length === 0 ? { isValid: true } : { isValid: false, errors };
};
```

### **Gestion d'Erreurs**
```typescript
const { withErrorHandling } = useErrorHandler();
await withErrorHandling(
  () => apiCall(),
  { maxRetries: 3, retryDelay: 1000 }
);
```

## 🎯 Standards Architecture (v2.0)

### **Principe SOLID**
- **S** : Single Responsibility (chaque hook/module = 1 responsabilité)
- **O** : Open/Closed (extension facile, modification limitée)
- **L** : Liskov Substitution (interfaces cohérentes)
- **I** : Interface Segregation (interfaces spécifiques)
- **D** : Dependency Inversion (abstractions, pas concret)

### **Patterns React Avancés**
- **Custom Hooks** pour logique réutilisable
- **Render Props** pour flexibilité
- **Compound Components** pour APIs cohérentes
- **Error Boundaries** pour stabilité

### **Performance Patterns**
- **React.memo** pour composants coûteux
- **useMemo/useCallback** pour calculs
- **Lazy loading** pour bundles
- **Code splitting** pour routes

---

**Architecture v2.0 : Enterprise-Grade !** 🏗️✨
