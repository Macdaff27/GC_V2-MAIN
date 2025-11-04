/**
 * Constantes de dimensions et espacements centralisées
 */

// Espacements
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// Bordures
export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const BORDER_WIDTH = {
  thin: 1,
  medium: 2,
  thick: 3,
} as const;

// Tailles de composants
export const COMPONENT_SIZES = {
  // Boutons
  button: {
    height: {
      sm: 32,
      md: 40,
      lg: 48,
    },
    padding: {
      horizontal: SPACING.md,
      vertical: SPACING.sm,
    },
  },

  // Champs de saisie
  input: {
    height: 40,
    padding: {
      horizontal: SPACING.md,
      vertical: SPACING.sm,
    },
  },

  // Cartes
  card: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    margin: {
      bottom: SPACING.sm,
    },
  },

  // FAB (Floating Action Button)
  fab: {
    size: 60,
    borderRadius: 30,
  },

  // Icônes
  icon: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  },
} as const;

// Ombres (pour iOS et Android)
export const SHADOWS = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
} as const;

// Animations
export const ANIMATION = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeInOut: 'ease-in-out',
    easeOut: 'ease-out',
    easeIn: 'ease-in',
  },
} as const;

// Layout
export const LAYOUT = {
  container: {
    padding: {
      horizontal: SPACING.xxl,
      vertical: SPACING.md,
    },
  },
  list: {
    contentPadding: {
      bottom: 48, // Espace pour le FAB
    },
  },
} as const;

// Types pour TypeScript
export type SpacingSize = keyof typeof SPACING;
export type BorderRadiusSize = keyof typeof BORDER_RADIUS;
export type BorderWidthSize = keyof typeof BORDER_WIDTH;
export type ShadowSize = keyof typeof SHADOWS;
export type AnimationDuration = keyof typeof ANIMATION.duration;
