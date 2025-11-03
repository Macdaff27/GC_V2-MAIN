import { useCallback, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import type { Palette, ClientWithRelations, DatabaseName, ClientFormValues } from '../types';

export interface UseAppStateReturn {
  // États
  manualDarkMode: boolean | null;
  clients: ClientWithRelations[];
  formVisible: boolean;
  formInitialValues: ClientFormValues | null;
  formSubmitting: boolean;
  activeDatabase: DatabaseName;

  // Computed values
  isDarkMode: boolean;
  palette: Palette;

  // Setters
  setManualDarkMode: (value: boolean | null) => void;
  setClients: (clients: ClientWithRelations[]) => void;
  setFormVisible: (visible: boolean) => void;
  setFormInitialValues: (values: ClientFormValues | null) => void;
  setFormSubmitting: (submitting: boolean) => void;
  setActiveDatabase: (db: DatabaseName) => void;

  // Handlers
  handleToggleTheme: (value: boolean) => void;
}

export const useAppState = (): UseAppStateReturn => {
  const systemIsDark = useColorScheme() === 'dark';

  // États de l'application
  const [manualDarkMode, setManualDarkMode] = useState<boolean | null>(null);
  const [clients, setClients] = useState<ClientWithRelations[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [formInitialValues, setFormInitialValues] = useState<ClientFormValues | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [activeDatabase, setActiveDatabase] = useState<DatabaseName>('main');

  // Valeurs calculées
  const isDarkMode = manualDarkMode ?? systemIsDark;

  const palette = useMemo<Palette>(() => (
    isDarkMode
      ? {
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
        }
      : {
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
        }
  ), [isDarkMode]);

  // Handlers
  const handleToggleTheme = useCallback((value: boolean) => {
    setManualDarkMode(value ? true : value === false ? false : null);
  }, []);

  return {
    // États
    manualDarkMode,
    clients,
    formVisible,
    formInitialValues,
    formSubmitting,
    activeDatabase,

    // Computed values
    isDarkMode,
    palette,

    // Setters
    setManualDarkMode,
    setClients,
    setFormVisible,
    setFormInitialValues,
    setFormSubmitting,
    setActiveDatabase,

    // Handlers
    handleToggleTheme,
  };
};
