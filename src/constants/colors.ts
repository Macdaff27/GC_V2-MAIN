/**
 * SYSTÈME DE COULEURS CENTRALISÉ POUR L'APPLICATION
 *
 * Ce fichier définit l'ensemble des couleurs utilisées dans l'application.
 * Il assure la cohérence visuelle et facilite les changements de thème.
 *
 * Principes de conception :
 * - Cohérence avec useAppState.ts (mêmes valeurs)
 * - Support des thèmes sombre et clair
 * - Couleurs sémantiques pour les états (succès, erreur, etc.)
 * - Accessibilité : contrastes suffisants pour la lisibilité
 * - Performance : utilisation de `as const` pour l'inférence de types
 */

/**
 * PALETTE DE COULEURS PRINCIPALE
 *
 * Structure organisée par catégories pour une maintenance facile :
 * - dark/light : Thèmes complets pour l'interface
 * - semantic : Couleurs fonctionnelles (succès, erreur, etc.)
 * - status : États des clients (terminé, en attente)
 * - actions : Boutons d'action (archiver, supprimer, etc.)
 */
export const COLORS = {
  /**
   * THÈME SOMBRE
   * Design inspiré de Slate (gris bleuté) pour un confort oculaire
   * Utilise des transparences pour créer de la profondeur
   */
  dark: {
    background: '#0F172A',        // Slate-900 : Fond principal très sombre
    surface: 'rgba(15, 23, 42, 0.72)',    // Surface translucide
    surfaceBorder: 'rgba(148, 163, 184, 0.14)', // Bordure subtile
    accent: '#38BDF8',            // Sky-400 : Accent bleu clair
    textPrimary: '#F8FAFC',       // Slate-50 : Texte principal
    textSecondary: '#CBD5F5',     // Slate-300 : Texte secondaire
    searchBackground: 'rgba(30, 41, 59, 0.92)', // Fond recherche translucide
    searchPlaceholder: 'rgba(248, 250, 252, 0.55)', // Placeholder atténué
    actionButtonBackground: 'rgba(148, 163, 184, 0.24)', // Bouton action
    actionButtonBackgroundDisabled: 'rgba(148, 163, 184, 0.12)', // Bouton désactivé
    actionButtonText: '#F8FAFC',  // Texte bouton
  },

  /**
   * THÈME CLAIR
   * Palette claire et aérée avec contrastes modérés
   * Utilise des tons neutres pour une apparence professionnelle
   */
  light: {
    background: '#F1F5F9',        // Slate-100 : Fond très clair
    surface: 'rgba(255, 255, 255, 0.88)', // Surface blanche translucide
    surfaceBorder: 'rgba(148, 163, 184, 0.20)', // Bordure légère
    accent: '#0284C7',            // Sky-600 : Accent bleu plus foncé
    textPrimary: '#0F172A',       // Slate-900 : Texte principal sombre
    textSecondary: '#475569',     // Slate-600 : Texte secondaire
    searchBackground: '#E2E8F0',  // Slate-200 : Fond recherche
    searchPlaceholder: 'rgba(15, 23, 42, 0.45)', // Placeholder sombre atténué
    actionButtonBackground: '#E2E8F0', // Bouton action clair
    actionButtonBackgroundDisabled: 'rgba(226, 232, 240, 0.65)', // Bouton désactivé
    actionButtonText: '#1E293B',  // Texte bouton sombre
  },

  /**
   * COULEURS SÉMANTIQUES
   * Couleurs fonctionnelles indépendantes du thème
   * Utilisées pour communiquer des états ou des actions
   */
  semantic: {
    success: '#22C55E',  // Green-500 : Succès, validation
    warning: '#F59E0B',  // Amber-500 : Avertissement, attention
    error: '#EF4444',    // Red-500 : Erreur, danger
    info: '#3B82F6',     // Blue-500 : Information, neutre
  },

  /**
   * COULEURS DE STATUT CLIENT
   * États visuels pour les clients dans les listes et cartes
   * Chaque statut a background, border et text coordonnés
   */
  status: {
    completed: {
      background: '#DCFCE7', // Green-100 : Fond vert pâle
      border: '#86EFAC',    // Green-300 : Bordure verte
      text: '#166534',      // Green-800 : Texte vert foncé
    },
    pending: {
      background: '#FEF3C7', // Amber-100 : Fond jaune pâle
      border: '#FDBA74',    // Orange-300 : Bordure orange
      text: '#B45309',      // Orange-700 : Texte orange foncé
    },
  },

  /**
   * COULEURS DES BOUTONS D'ACTION
   * Styles pour les différentes actions utilisateur
   * Chaque action a une identité visuelle distinctive
   */
  actions: {
    primary: {
      background: '#E0F2FE', // Sky-100 : Fond bleu pâle
      border: '#0EA5E9',    // Sky-500 : Bordure bleue
      text: '#0369A1',      // Sky-700 : Texte bleu foncé
    },
    danger: {
      background: '#FEE2E2', // Red-100 : Fond rouge pâle
      border: '#DC2626',    // Red-600 : Bordure rouge
      text: '#B91C1C',      // Red-700 : Texte rouge foncé
    },
    archive: {
      background: 'rgba(251, 146, 60, 0.15)', // Orange-400 translucide
      border: '#FB923C',    // Orange-400 : Bordure orange
      text: '#0F172A',      // Slate-900 : Texte sombre
    },
    unarchive: {
      background: 'rgba(34, 197, 94, 0.15)', // Green-500 translucide
      border: '#22C55E',    // Green-500 : Bordure verte
      text: '#0F172A',      // Slate-900 : Texte sombre
    },
  },
} as const;

/**
 * TYPES TYPESCRIPT POUR L'INFÉRENCE DE TYPES
 *
 * Ces types permettent une utilisation type-safe des couleurs :
 * - Auto-complétion dans l'IDE
 * - Vérification à la compilation
 * - Refactoring sécurisé
 *
 * Utilisation dans les composants :
 * ```typescript
 * interface ButtonProps {
 *   colorScheme?: ColorScheme;  // Thème sombre/clair complet
 *   semanticColor?: keyof SemanticColors;  // 'success' | 'error' | etc.
 *   statusColor?: StatusColors['completed'];  // Objet {background, border, text}
 *   actionColor?: ActionColors['primary'];  // Style de bouton d'action
 * }
 * ```
 */

/**
 * Type pour un thème complet (sombre ou clair)
 * Contient toutes les propriétés nécessaires à l'interface
 */
export type ColorScheme = typeof COLORS.dark;

/**
 * Type pour les couleurs sémantiques
 * Utilisé pour les états fonctionnels (succès, erreur, etc.)
 */
export type SemanticColors = typeof COLORS.semantic;

/**
 * Type pour les couleurs de statut client
 * Structure avec background, border et text coordonnés
 */
export type StatusColors = typeof COLORS.status;

/**
 * Type pour les couleurs des boutons d'action
 * Styles complets pour les différentes actions utilisateur
 */
export type ActionColors = typeof COLORS.actions;
