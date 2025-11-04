/**
 * Configuration d'optimisation du bundle
 * Recommandations pour améliorer les performances de chargement
 */

/**
 * COMPOSANTS À CHARGER EN LAZY LOADING
 *
 * Ces composants peuvent être chargés à la demande pour réduire le bundle initial :
 *
 * 1. ClientFormModal - Chargé seulement lors de l'ajout/édition
 * 2. Stats - Peut être différé si nécessaire
 * 3. Composants d'export/import - Chargés lors de l'action
 *
 * Exemple d'implémentation :
 *
 * const ClientFormModal = lazy(() => import('../components/ClientFormModal'));
 *
 * <Suspense fallback={<LoadingSpinner />}>
 *   <ClientFormModal {...props} />
 * </Suspense>
 */

/**
 * HOOKS À OPTIMISER
 *
 * 1. useClientFilters - Mémoïser les calculs coûteux
 * 2. useSmartScroll - Optimiser les calculs de position
 * 3. useAppState - Palette déjà optimisée
 */

/**
 * CONSTANTES À EXTRAIRE
 *
 * Les grandes constantes peuvent être extraites dans des fichiers séparés :
 * - Grandes listes de données
 * - Configurations complexes
 * - Assets statiques volumineux
 */

/**
 * TREE SHAKING OPTIMISATIONS
 *
 * 1. Importer uniquement les fonctions nécessaires :
 *    ✅ import { validateName } from './validation'
 *    ❌ import * as validation from './validation'
 *
 * 2. Éviter les imports de modules entiers :
 *    ✅ import Alert from 'react-native/Libraries/Alert/Alert'
 *    ❌ import { Alert } from 'react-native'
 */

/**
 * CODE SPLITTING RECOMMANDATIONS
 *
 * 1. Séparer les écrans principaux :
 *    - Écran Clients (chargé par défaut)
 *    - Écran Archives (lazy loaded)
 *    - Écran Paramètres (lazy loaded)
 *
 * 2. Séparer les fonctionnalités :
 *    - Fonctionnalités d'export/import
 *    - Fonctionnalités de recherche avancée
 *    - Fonctionnalités d'administration
 */

/**
 * MONITORING DES PERFORMANCES
 *
 * Métriques à surveiller :
 * - Taille du bundle (devrait rester < 2MB)
 * - Time to Interactive (devrait être < 3s)
 * - Bundle analysis avec `npx react-native-bundle-analyzer`
 */

/**
 * OPTIMISATIONS RN SPÉCIFIQUES
 *
 * 1. Hermes Engine - Activé par défaut dans RN 0.70+
 * 2. RAM Bundling - Pour réduire la taille
 * 3. ProGuard/R8 - Pour Android release
 * 4. Flipper - Pour le debugging (désactiver en prod)
 */

/**
 * ASSETS OPTIMISATION
 *
 * 1. Images - Utiliser des formats optimisés (WebP)
 * 2. Icônes - Préférer les icônes vectorielles
 * 3. Fonts - Charger uniquement les caractères nécessaires
 */

/**
 * CONFIGURATION DE BUILD RECOMMANDÉE
 *
 * metro.config.js :
 * module.exports = {
 *   transformer: {
 *     getTransformOptions: async () => ({
 *       transform: {
 *         experimentalImportSupport: false,
 *         inlineRequires: true,
 *       },
 *     }),
 *   },
 * };
 */

/**
 * OUTILS DE MONITORING
 *
 * 1. `npx react-native-bundle-analyzer` - Analyse du bundle
 * 2. `npx @sentry/react-native` - Monitoring d'erreurs
 * 3. `npx react-native-performance` - Métriques de perf
 */

export const BUNDLE_CONFIG = {
  // Configuration recommandée pour le bundle
  maxBundleSize: '2MB',
  maxAssetSize: '500KB',

  // Lazy loading recommendations
  lazyComponents: [
    'ClientFormModal',
    'Stats',
    'ExportImportFeatures',
  ],

  // Tree shaking hints
  sideEffects: false,

  // Performance targets
  performance: {
    timeToInteractive: '< 3s',
    firstContentfulPaint: '< 1.5s',
    bundleSize: '< 2MB',
  },
} as const;
