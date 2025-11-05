/**
 * Importations React et hooks nécessaires pour useAppState
 */
import { useCallback, useMemo, useState } from 'react';
// Hook React Native pour détecter le thème système (clair/sombre)
import { useColorScheme } from 'react-native';
// Importations des types TypeScript pour le typage strict
import type { Palette, ClientWithRelations, DatabaseName, ClientFormValues } from '../types';

/**
 * Interface définissant le retour du hook useAppState
 * Centralise tous les états et fonctions de gestion de l'état global de l'application
 */
export interface UseAppStateReturn {
  // États de l'application - valeurs stockées dans le state local
  manualDarkMode: boolean | null; // Thème manuel (null = suivre le système)
  clients: ClientWithRelations[]; // Liste des clients chargés
  formVisible: boolean; // Visibilité du modal de formulaire
  formInitialValues: ClientFormValues | null; // Valeurs initiales du formulaire
  formSubmitting: boolean; // État de soumission du formulaire
  activeDatabase: DatabaseName; // Base de données active ('main' ou 'archive')

  // Valeurs calculées - dérivées des états ci-dessus
  isDarkMode: boolean; // Thème effectif (manuel ou système)
  palette: Palette; // Palette de couleurs du thème actuel

  // Fonctions de mise à jour des états (setters)
  setManualDarkMode: (value: boolean | null) => void;
  setClients: (clients: ClientWithRelations[]) => void;
  setFormVisible: (visible: boolean) => void;
  setFormInitialValues: (values: ClientFormValues | null) => void;
  setFormSubmitting: (submitting: boolean) => void;
  setActiveDatabase: (db: DatabaseName) => void;

  // Gestionnaires d'événements (handlers)
  handleToggleTheme: (value: boolean) => void; // Gestionnaire de changement de thème
}

/**
 * Hook personnalisé useAppState - Gestion centralisée de l'état global de l'application
 * Combine la gestion du thème, des clients, du formulaire et de la base de données active
 * Fournit une interface unifiée pour tous les états et actions de l'application
 */
export const useAppState = (): UseAppStateReturn => {
  // Détection du thème système (clair/sombre) via React Native
  const systemIsDark = useColorScheme() === 'dark';

  // États locaux de l'application gérés par useState

  // Gestion du thème : null = suivre le système, true = sombre, false = clair
  const [manualDarkMode, setManualDarkMode] = useState<boolean | null>(null);

  // Liste des clients chargés depuis la base de données
  const [clients, setClients] = useState<ClientWithRelations[]>([]);

  // États du modal de formulaire
  const [formVisible, setFormVisible] = useState(false); // Visibilité du modal
  const [formInitialValues, setFormInitialValues] = useState<ClientFormValues | null>(null); // Valeurs pour édition
  const [formSubmitting, setFormSubmitting] = useState(false); // État de chargement lors de soumission

  // Base de données active ('main' par défaut, peut être 'archive')
  const [activeDatabase, setActiveDatabase] = useState<DatabaseName>('main');

  // Valeurs calculées à partir des états ci-dessus

  // Thème effectif : manuel si défini, sinon thème système
  const isDarkMode = manualDarkMode ?? systemIsDark;

  // Palette de couleurs complète selon le thème (mémoïsée pour performance)
  const palette = useMemo<Palette>(() => (
    isDarkMode
      ? {
          // Thème sombre - couleurs adaptées pour un fond sombre
          background: '#0F172A', // Bleu très foncé
          surface: 'rgba(15, 23, 42, 0.72)', // Surface semi-transparente
          surfaceBorder: 'rgba(148, 163, 184, 0.14)', // Bordure subtile
          accent: '#38BDF8', // Bleu ciel pour les accents
          textPrimary: '#F8FAFC', // Texte blanc/gris clair
          textSecondary: '#CBD5F5', // Texte secondaire plus clair
          searchBackground: 'rgba(30, 41, 59, 0.92)', // Fond de recherche sombre
          searchPlaceholder: 'rgba(248, 250, 252, 0.55)', // Placeholder semi-transparent
          actionButtonBackground: 'rgba(148, 163, 184, 0.24)', // Fond bouton d'action
          actionButtonBackgroundDisabled: 'rgba(148, 163, 184, 0.12)', // Fond désactivé
          actionButtonText: '#F8FAFC', // Texte blanc pour boutons
          // Couleurs des switches (on/off)
          trackOff: '#374151', // Piste désactivée
          trackOn: '#10B981', // Piste activée (vert)
          thumbOff: '#9CA3AF', // Bouton désactivé
          thumbOn: '#34D399', // Bouton activé (vert)
        }
      : {
          // Thème clair - couleurs adaptées pour un fond clair
          background: '#F1F5F9', // Gris très clair
          surface: 'rgba(255, 255, 255, 0.88)', // Blanc semi-transparent
          surfaceBorder: 'rgba(148, 163, 184, 0.20)', // Bordure grise
          accent: '#0284C7', // Bleu pour les accents
          textPrimary: '#0F172A', // Texte très foncé
          textSecondary: '#475569', // Texte secondaire
          searchBackground: '#E2E8F0', // Fond de recherche gris clair
          searchPlaceholder: 'rgba(15, 23, 42, 0.45)', // Placeholder semi-transparent
          actionButtonBackground: '#E2E8F0', // Fond bouton d'action
          actionButtonBackgroundDisabled: 'rgba(226, 232, 240, 0.65)', // Fond désactivé
          actionButtonText: '#1E293B', // Texte foncé pour boutons
          // Couleurs des switches (on/off)
          trackOff: '#CBD5E1', // Piste désactivée
          trackOn: '#10B981', // Piste activée (vert)
          thumbOff: '#94A3B8', // Bouton désactivé
          thumbOn: '#34D399', // Bouton activé (vert)
        }
  ), [isDarkMode]); // Re-calcul seulement si le thème change

  // Gestionnaires d'événements (mémoïsés pour stabilité des références)

  /**
   * Gestionnaire de changement de thème
   * @param value - true pour sombre, false pour clair, null pour système
   */
  const handleToggleTheme = useCallback((value: boolean) => {
    setManualDarkMode(value ? true : value === false ? false : null);
  }, []);

  // Retour du hook avec tous les états, valeurs calculées et fonctions
  return {
    // États bruts de l'application (valeurs stockées)
    manualDarkMode, // État du thème manuel
    clients, // Liste des clients
    formVisible, // Visibilité du modal
    formInitialValues, // Valeurs d'initialisation du formulaire
    formSubmitting, // État de soumission
    activeDatabase, // Base de données sélectionnée

    // Valeurs calculées (dérivées des états ci-dessus)
    isDarkMode, // Thème effectif (manuel ou système)
    palette, // Palette de couleurs complète du thème

    // Fonctions de mise à jour des états (setters directs)
    setManualDarkMode, // Modifier le thème manuel
    setClients, // Mettre à jour la liste des clients
    setFormVisible, // Contrôler la visibilité du modal
    setFormInitialValues, // Définir les valeurs initiales du formulaire
    setFormSubmitting, // Gérer l'état de soumission
    setActiveDatabase, // Changer de base de données

    // Gestionnaires d'événements (handlers métier)
    handleToggleTheme, // Gestionnaire unifié de changement de thème
  };
};
