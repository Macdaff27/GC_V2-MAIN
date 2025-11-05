/**
 * SYSTÈME DE DESIGN POUR LES DIMENSIONS ET ESPACEMENTS
 *
 * Ce fichier définit un système de dimensions cohérent pour l'application.
 * Il assure la cohérence visuelle et facilite la maintenance du design system.
 *
 * Principes de conception :
 * - Échelle de 4px (base 4) pour les alignements parfaits
 * - Progression géométrique : chaque taille = précédente × 1.5
 * - Nommage sémantique : xs, sm, md, lg, xl, xxl, xxxl
 * - Performance : `as const` pour l'inférence de types
 */

/**
 * ÉCHELLE D'ESPACEMENT PRINCIPALE
 *
 * Système d'espacement basé sur une échelle de 4px :
 * - xs: 4px (espacement minimal, bordures fines)
 * - sm: 8px (espacement compact, éléments proches)
 * - md: 12px (espacement standard, composants)
 * - lg: 16px (espacement confortable, sections)
 * - xl: 20px (espacement généreux, groupes)
 * - xxl: 24px (espacement large, conteneurs)
 * - xxxl: 32px (espacement maximal, layouts)
 */
export const SPACING = {
  xs: 4,     // 4px : Bordures, séparateurs fins
  sm: 8,     // 8px : Padding interne compact
  md: 12,    // 12px : Espacement standard des composants
  lg: 16,    // 16px : Marges entre sections
  xl: 20,    // 20px : Espacement généreux
  xxl: 24,   // 24px : Conteneurs principaux
  xxxl: 32,  // 32px : Layouts, espacement maximal
} as const;

/**
 * RAYONS DE BORDURE
 *
 * Échelle de bordures arrondies pour les composants :
 * - sm: 8px (légèrement arrondi, boutons secondaires)
 * - md: 12px (arrondi standard, cartes, modals)
 * - lg: 16px (bien arrondi, éléments importants)
 * - xl: 20px (très arrondi, éléments spéciaux)
 * - xxl: 24px (maximalement arrondi)
 * - full: 9999px (complètement circulaire)
 */
export const BORDER_RADIUS = {
  sm: 8,      // Boutons secondaires, inputs
  md: 12,     // Cartes, modals, conteneurs
  lg: 16,     // Éléments importants, FAB
  xl: 20,     // Éléments spéciaux, badges
  xxl: 24,    // Très arrondi, éléments décoratifs
  full: 9999, // Circulaire complet (avatars, indicateurs)
} as const;

/**
 * ÉPAISSEURS DE BORDURE
 *
 * Échelle pour les bordures et séparateurs :
 * - thin: 1px (bordures fines, focus, séparateurs)
 * - medium: 2px (bordures standard, états actifs)
 * - thick: 3px (bordures épaisses, éléments importants)
 */
export const BORDER_WIDTH = {
  thin: 1,    // Bordures fines, focus rings
  medium: 2,  // Bordures standard, états actifs
  thick: 3,   // Bordures épaisses, éléments importants
} as const;

/**
 * TAILLES STANDARDISÉES DES COMPOSANTS
 *
 * Dimensions prédéfinies pour maintenir la cohérence des composants.
 * Toutes les tailles sont calculées par rapport à l'échelle d'espacement.
 */
export const COMPONENT_SIZES = {
  /**
   * BOUTONS - Tailles standardisées
   * Hauteurs calculées pour maintenir les proportions avec le padding
   */
  button: {
    height: {
      sm: 32,  // Petit bouton (32px hauteur totale)
      md: 40,  // Bouton standard (40px hauteur totale)
      lg: 48,  // Gros bouton (48px hauteur totale)
    },
    padding: {
      horizontal: SPACING.md, // 12px padding horizontal
      vertical: SPACING.sm,   // 8px padding vertical
    },
  },

  /**
   * CHAMPS DE SAISIE
   * Dimensions standard pour tous les inputs de l'application
   */
  input: {
    height: 40,  // Hauteur fixe pour l'alignement
    padding: {
      horizontal: SPACING.md, // 12px padding interne
      vertical: SPACING.sm,   // 8px padding vertical
    },
  },

  /**
   * CARTES (Cards)
   * Style standard pour les éléments de liste et conteneurs
   */
  card: {
    borderRadius: BORDER_RADIUS.xl, // 20px (bien arrondi)
    padding: SPACING.md,             // 12px padding interne
    margin: {
      bottom: SPACING.sm,            // 8px marge entre cartes
    },
  },

  /**
   * FAB (Floating Action Button)
   * Bouton d'action flottant standard
   */
  fab: {
    size: 60,        // Diamètre du bouton
    borderRadius: 30, // Rayon pour le cercle parfait
  },

  /**
   * ICÔNES - Échelle de tailles
   * Tailles standard pour les icônes dans l'interface
   */
  icon: {
    sm: 16,  // Petite icône (labels, indicateurs)
    md: 20,  // Icône standard (boutons, navigation)
    lg: 24,  // Grande icône (actions principales)
    xl: 32,  // Très grande icône (héros, illustrations)
  },
} as const;

/**
 * SYSTÈME D'OMBRES POUR iOS ET ANDROID
 *
 * Ombres standardisées avec propriétés compatibles pour les deux plateformes :
 * - iOS : shadowColor, shadowOffset, shadowOpacity, shadowRadius
 * - Android : elevation (converti automatiquement)
 *
 * Échelle progressive pour créer de la hiérarchie visuelle :
 * - sm : Subtile, éléments secondaires
 * - md : Standard, cartes et boutons
 * - lg : Importante, modals et overlays
 * - xl : Forte, éléments flottants importants
 */
export const SHADOWS = {
  sm: {
    shadowColor: '#000000',           // Couleur noire pour toutes les ombres
    shadowOffset: { width: 0, height: 1 }, // Décalage subtil vers le bas
    shadowOpacity: 0.18,              // Opacité faible
    shadowRadius: 2,                  // Rayon de flou petit
    elevation: 2,                     // Équivalent Android
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 }, // Décalage modéré
    shadowOpacity: 0.14,              // Opacité standard
    shadowRadius: 4,                  // Rayon de flou moyen
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 }, // Décalage important
    shadowOpacity: 0.12,              // Opacité réduite pour subtilité
    shadowRadius: 8,                  // Rayon de flou large
    elevation: 6,                     // Elevation plus importante
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 }, // Décalage maximal
    shadowOpacity: 0.18,              // Opacité plus forte
    shadowRadius: 10,                 // Rayon de flou maximal
    elevation: 8,                     // Elevation maximale
  },
} as const;

/**
 * CONSTANTES D'ANIMATION
 *
 * Durées et easing standards pour les animations de l'application.
 * Respecte les guidelines Material Design et iOS Human Interface.
 */
export const ANIMATION = {
  /**
   * DURÉES D'ANIMATION
   * Basées sur les recommandations ergonomiques :
   * - fast: 150ms (feedback immédiat, micro-interactions)
   * - normal: 300ms (transitions standard, changements d'état)
   * - slow: 500ms (animations complexes, changements majeurs)
   */
  duration: {
    fast: 150,    // Feedback rapide (boutons, focus)
    normal: 300,  // Transition standard (navigation, états)
    slow: 500,    // Animation lente (modals, loading)
  },

  /**
   * FONCTIONS D'EASING
   * Courbes d'accélération pour les animations naturelles :
   * - easeInOut: Accélération et décélération symétriques
   * - easeOut: Décélération progressive (naturelle)
   * - easeIn: Accélération progressive
   */
  easing: {
    easeInOut: 'ease-in-out',  // Transitions équilibrées
    easeOut: 'ease-out',       // Fin douce (recommandé)
    easeIn: 'ease-in',         // Début progressif
  },
} as const;

/**
 * CONSTANTES DE LAYOUT
 *
 * Espacements et dimensions pour la structure générale de l'application.
 * Définit les règles d'espacement pour les écrans et conteneurs.
 */
export const LAYOUT = {
  /**
   * CONTENEUR PRINCIPAL
   * Padding standard pour tous les écrans de l'application
   */
  container: {
    padding: {
      horizontal: SPACING.xxl,  // 24px padding latéral
      vertical: SPACING.md,     // 12px padding vertical
    },
  },

  /**
   * LISTES ET SCROLLVIEWS
   * Configuration spéciale pour les listes avec FAB
   */
  list: {
    contentPadding: {
      bottom: 48,  // Espace réservé au FAB (60px + marge)
    },
  },
} as const;

/**
 * TYPES TYPESCRIPT POUR L'INFÉRENCE DE TYPES
 *
 * Ces types permettent une utilisation type-safe des dimensions :
 * - Auto-complétion dans l'IDE
 * - Vérification à la compilation
 * - Refactoring sécurisé
 *
 * Utilisation dans les composants :
 * - spacing: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl'
 * - borderRadius: 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'full'
 * - shadow: 'sm' | 'md' | 'lg' | 'xl'
 * - animationDuration: 'fast' | 'normal' | 'slow'
 */

/**
 * Type pour les tailles d'espacement
 * Représente toutes les clés disponibles dans SPACING
 */
export type SpacingSize = keyof typeof SPACING;

/**
 * Type pour les rayons de bordure
 * Représente toutes les clés disponibles dans BORDER_RADIUS
 */
export type BorderRadiusSize = keyof typeof BORDER_RADIUS;

/**
 * Type pour les épaisseurs de bordure
 * Représente toutes les clés disponibles dans BORDER_WIDTH
 */
export type BorderWidthSize = keyof typeof BORDER_WIDTH;

/**
 * Type pour les niveaux d'ombre
 * Représente toutes les clés disponibles dans SHADOWS
 */
export type ShadowSize = keyof typeof SHADOWS;

/**
 * Type pour les durées d'animation
 * Représente toutes les clés disponibles dans ANIMATION.duration
 */
export type AnimationDuration = keyof typeof ANIMATION.duration;
