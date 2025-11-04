/**
 * Constantes de couleurs centralisées pour l'application
 * Utilise les mêmes valeurs que dans useAppState.ts pour cohérence
 */

// Couleurs de base
export const COLORS = {
  // Thème sombre
  dark: {
    background: '#0F172A',
    surface: 'rgba(15, 23, 42, 0.72)',
    surfaceBorder: 'rgba(148, 163, 184, 0.14)',
    accent: '#38BDF8',
    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5F5',
    searchBackground: 'rgba(30, 41, 59, 0.92)',
    searchPlaceholder: 'rgba(248, 250, 252, 0.55)',
    actionButtonBackground: 'rgba(148, 163, 184, 0.24)',
    actionButtonBackgroundDisabled: 'rgba(148, 163, 184, 0.12)',
    actionButtonText: '#F8FAFC',
  },

  // Thème clair
  light: {
    background: '#F1F5F9',
    surface: 'rgba(255, 255, 255, 0.88)',
    surfaceBorder: 'rgba(148, 163, 184, 0.20)',
    accent: '#0284C7',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    searchBackground: '#E2E8F0',
    searchPlaceholder: 'rgba(15, 23, 42, 0.45)',
    actionButtonBackground: '#E2E8F0',
    actionButtonBackgroundDisabled: 'rgba(226, 232, 240, 0.65)',
    actionButtonText: '#1E293B',
  },

  // Couleurs sémantiques
  semantic: {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // Couleurs des statuts clients
  status: {
    completed: {
      background: '#DCFCE7',
      border: '#86EFAC',
      text: '#166534',
    },
    pending: {
      background: '#FEF3C7',
      border: '#FDBA74',
      text: '#B45309',
    },
  },

  // Couleurs des boutons d'action
  actions: {
    primary: {
      background: '#E0F2FE',
      border: '#0EA5E9',
      text: '#0369A1',
    },
    danger: {
      background: '#FEE2E2',
      border: '#DC2626',
      text: '#B91C1C',
    },
    archive: {
      background: 'rgba(251, 146, 60, 0.15)',
      border: '#FB923C',
      text: '#0F172A',
    },
    unarchive: {
      background: 'rgba(34, 197, 94, 0.15)',
      border: '#22C55E',
      text: '#0F172A',
    },
  },
} as const;

// Types pour TypeScript
export type ColorScheme = typeof COLORS.dark;
export type SemanticColors = typeof COLORS.semantic;
export type StatusColors = typeof COLORS.status;
export type ActionColors = typeof COLORS.actions;
