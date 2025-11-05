/**
 * Importations React et composants nécessaires
 */
import React from 'react';
// Importations des composants de base React Native pour l'interface
import { View, StyleSheet, Pressable, TextInput, Switch } from 'react-native';
// Importation du composant Stats pour les filtres de statut
import Stats from './Stats';
// Importations des types TypeScript pour le typage strict
import type { Palette, DatabaseName, StatusFilter } from '../types';
// Importation du composant de texte personnalisé
import AppText from '../../AppText';

/**
 * Interface définissant toutes les propriétés du composant AppControls
 * Ce composant centralise tous les contrôles de l'application
 */
export interface AppControlsProps {
  // Propriétés liées à la base de données
  activeDatabase: DatabaseName; // Base actuellement sélectionnée ('main' ou 'archive')
  mainReady: boolean; // État de préparation de la base principale
  archiveReady: boolean; // État de préparation de la base archive
  onSelectDatabase: (dbName: DatabaseName) => void; // Fonction pour changer de base

  // Propriétés liées à la recherche et aux filtres
  searchQuery: string; // Texte de recherche actuel
  onChangeSearchQuery: (query: string) => void; // Fonction appelée lors de la saisie
  statusFilter: StatusFilter; // Filtre de statut actuel
  onChangeStatusFilter: (filter: StatusFilter) => void; // Fonction pour changer le filtre
  statusCounts: { // Comptages par statut pour affichage
    total: number;
    inProgress: number;
    done: number;
  };
  isSortAscending: boolean; // Direction du tri (true = croissant, false = décroissant)
  onToggleSort: () => void; // Fonction pour inverser le tri

  // Propriétés liées aux actions de données (import/export)
  onExport: () => void; // Fonction d'export des données
  onImport: () => void; // Fonction d'import des données
  isExporting: boolean; // État d'export en cours
  isImporting: boolean; // État d'import en cours
  clientsCount: number; // Nombre total de clients

  // Propriétés liées au thème
  isDark: boolean | null; // Thème manuel (null = suivre le système)
  systemIsDark: boolean; // État du thème système
  onToggleTheme: (value: boolean) => void; // Fonction pour changer le thème

  // Palette de couleurs pour le thème actuel
  palette: Palette;
}

/**
 * Composant AppControls - Barre de contrôles principale de l'application
 * Centralise tous les contrôles utilisateur : sélection de base, recherche,
 * filtres, actions d'import/export, thème, et tri
 */
export const AppControls: React.FC<AppControlsProps> = ({
  activeDatabase,
  mainReady,
  archiveReady,
  onSelectDatabase,
  searchQuery,
  onChangeSearchQuery,
  statusFilter,
  onChangeStatusFilter,
  statusCounts,
  isSortAscending,
  onToggleSort,
  onExport,
  onImport,
  isExporting,
  isImporting,
  clientsCount,
  isDark,
  systemIsDark,
  onToggleTheme,
  palette,
}) => {
  // États calculés pour les boutons d'export/import
  const isExportDisabled = isExporting || clientsCount === 0; // Désactiver si export en cours ou pas de données
  const exportLabel = isExporting ? 'Export en cours...' : 'Exporter'; // Label dynamique selon l'état
  const importLabel = isImporting ? 'Import en cours...' : 'Importer'; // Label dynamique selon l'état

  // Structure JSX du rendu - conteneur principal des contrôles
  return (
    <View style={styles.controls}>
      {/* Sélecteur de base de données - Deux boutons pour basculer entre base principale et archive */}
      <View style={styles.databaseToggle}>
        {/* Bouton pour la base principale (clients actifs) */}
        <Pressable
          onPress={() => onSelectDatabase('main')}
          style={({ pressed }) => [
            styles.databaseToggleButton,
            activeDatabase === 'main' && styles.databaseToggleButtonActive,
            {
              borderColor: palette.accent,
              backgroundColor: activeDatabase === 'main' ? palette.accent : 'transparent',
            },
            pressed && styles.databaseToggleButtonPressed,
          ]}
        >
          <AppText
            style={[
              styles.databaseToggleText,
              { color: activeDatabase === 'main' ? palette.background : palette.textPrimary },
            ]}
          >
            Actives ({mainReady ? 'OK' : '...'})
          </AppText>
        </Pressable>

        {/* Bouton pour la base archive (clients archivés) */}
        <Pressable
          onPress={() => onSelectDatabase('archive')}
          style={({ pressed }) => [
            styles.databaseToggleButton,
            activeDatabase === 'archive' && styles.databaseToggleButtonActive,
            {
              borderColor: palette.accent,
              backgroundColor: activeDatabase === 'archive' ? palette.accent : 'transparent',
            },
            pressed && styles.databaseToggleButtonPressed,
          ]}
        >
          <AppText
            style={[
              styles.databaseToggleText,
              { color: activeDatabase === 'archive' ? palette.background : palette.textPrimary },
            ]}
          >
            Archives ({archiveReady ? 'OK' : '...'})
          </AppText>
        </Pressable>
      </View>

      {/* Barre de recherche - Permet de filtrer les clients par nom, page ou note */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: palette.searchBackground,
            borderColor: palette.surfaceBorder,
          },
        ]}
      >
        <TextInput
          value={searchQuery}
          onChangeText={onChangeSearchQuery}
          style={[styles.searchInput, { color: palette.textPrimary }]}
          placeholder="Filtrer par nom, page ou note..."
          placeholderTextColor={palette.searchPlaceholder}
          selectionColor={palette.accent}
          returnKeyType="search"
          accessibilityLabel="Barre de recherche des clientes"
        />
      </View>

      {/* Actions de données - Boutons pour importer/exporter les données JSON */}
      <View style={styles.dataActions}>
        {/* Bouton d'export - Exporte toutes les données en JSON */}
        <Pressable
          onPress={onExport}
          disabled={isExportDisabled}
          accessibilityRole="button"
          accessibilityLabel="Exporter toutes les clientes en JSON"
          style={({ pressed }) => [
            styles.dataButton,
            {
              backgroundColor: palette.accent,
              borderColor: palette.accent,
              opacity: isExportDisabled ? 0.6 : pressed ? 0.85 : 1,
            },
          ]}
        >
          <AppText style={[styles.dataButtonText, { color: palette.background }]}>
            {exportLabel}
          </AppText>
        </Pressable>
        {/* Bouton d'import - Importe des données depuis un fichier JSON */}
        <Pressable
          onPress={onImport}
          disabled={isImporting}
          accessibilityRole="button"
          accessibilityLabel="Importer un fichier JSON de clientes"
          style={({ pressed }) => [
            styles.dataButton,
            {
              backgroundColor: 'transparent',
              borderColor: palette.accent,
              opacity: isImporting ? 0.6 : pressed ? 0.85 : 1,
            },
          ]}
        >
          <AppText style={[styles.dataButtonText, { color: palette.accent }]}>
            {importLabel}
          </AppText>
        </Pressable>
      </View>

      {/* Composant Stats - Affiche les compteurs par statut et permet de filtrer */}
      <Stats
        statusFilter={statusFilter}
        onFilterChange={onChangeStatusFilter}
        counts={statusCounts}
        palette={palette}
      />

      {/* Contrôle du thème - Switch pour basculer entre thème clair et sombre */}
      <View style={styles.themeControls}>
        <AppText style={[styles.themeLabel, { color: palette.textSecondary }]}>Thème sombre</AppText>
        <Switch
          value={isDark ?? systemIsDark}
          onValueChange={onToggleTheme}
          thumbColor={(isDark ?? systemIsDark) ? palette.accent : palette.surfaceBorder}
          trackColor={{ true: palette.accent, false: palette.surfaceBorder }}
        />
      </View>

      {/* Bouton de tri - Permet de changer l'ordre de tri par numéro de page */}
      <View style={styles.actions}>
        <Pressable
          onPress={onToggleSort}
          accessibilityRole="button"
          accessibilityLabel={isSortAscending
            ? 'Basculer en tri décroissant par numéro de page'
            : 'Basculer en tri croissant par numéro de page'}
          accessibilityHint="Modifier l'ordre de tri des clientes par numéro de page"
          style={({ pressed }) => [
            styles.singleActionButton,
            {
              backgroundColor: palette.actionButtonBackground,
              opacity: pressed ? 0.92 : 1,
            },
          ]}
        >
          <AppText
            style={[
              styles.singleActionButtonLabel,
              { color: palette.actionButtonText },
            ]}
          >
            {isSortAscending ? 'Page croissant' : 'Page décroissant'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
};

// Styles CSS-in-JS pour le composant AppControls utilisant StyleSheet de React Native
const styles = StyleSheet.create({
  // Conteneur principal des contrôles - disposition verticale avec espacement
  controls: {
    gap: 12, // Espacement entre chaque contrôle
    marginBottom: 16, // Marge inférieure
  },

  // Styles pour le sélecteur de base de données
  databaseToggle: {
    flexDirection: 'row', // Disposition horizontale
    gap: 10, // Espacement entre les boutons
    marginBottom: 4, // Petite marge inférieure
  },
  databaseToggleButton: {
    flex: 1, // Chaque bouton prend la même largeur
    borderWidth: 1, // Bordure fine
    borderRadius: 12, // Coins arrondis
    paddingVertical: 10, // Padding vertical
    paddingHorizontal: 12, // Padding horizontal
    alignItems: 'center', // Centrage horizontal du contenu
    justifyContent: 'center', // Centrage vertical du contenu
  },
  databaseToggleButtonActive: {}, // Style vide pour le bouton actif (styles dynamiques)
  databaseToggleButtonPressed: {
    opacity: 0.8, // Légère transparence au press
  },
  databaseToggleText: {
    fontSize: 13, // Taille de police
    fontWeight: '700', // Graisse du texte (bold)
    letterSpacing: 0.3, // Espacement des lettres
  },

  // Styles pour la barre de recherche
  searchContainer: {
    flexDirection: 'row', // Disposition horizontale
    alignItems: 'center', // Alignement vertical centré
    borderRadius: 12, // Coins arrondis
    borderWidth: 1, // Bordure
    paddingHorizontal: 12, // Padding horizontal
    paddingVertical: 6, // Padding vertical
    minHeight: 40, // Hauteur minimale
  },
  searchInput: {
    flex: 1, // Prend tout l'espace disponible
    fontSize: 15, // Taille de police
    fontWeight: '500', // Graisse moyenne
    letterSpacing: 0.2, // Espacement des lettres
  },

  // Styles pour les actions de données (import/export)
  dataActions: {
    flexDirection: 'row', // Disposition horizontale
    gap: 10, // Espacement entre les boutons
  },
  dataButton: {
    flex: 1, // Chaque bouton prend la même largeur
    borderWidth: 1, // Bordure
    borderRadius: 12, // Coins arrondis
    paddingVertical: 8, // Padding vertical
    paddingHorizontal: 12, // Padding horizontal
    alignItems: 'center', // Centrage horizontal
    justifyContent: 'center', // Centrage vertical
  },
  dataButtonText: {
    fontSize: 13, // Taille de police
    fontWeight: '600', // Graisse semi-bold
    letterSpacing: 0.2, // Espacement des lettres
  },

  // Styles pour le contrôle du thème
  themeControls: {
    flexDirection: 'row', // Disposition horizontale
    alignItems: 'center', // Alignement vertical centré
    justifyContent: 'space-between', // Espace entre label et switch
    paddingVertical: 8, // Padding vertical
    paddingHorizontal: 12, // Padding horizontal
    borderRadius: 12, // Coins arrondis
    borderWidth: 1, // Bordure fine
    borderColor: 'rgba(148, 163, 184, 0.2)', // Couleur de bordure semi-transparente
    backgroundColor: 'rgba(148, 163, 184, 0.05)', // Fond légèrement coloré
  },
  themeLabel: {
    fontSize: 15, // Taille de police
    fontWeight: '600', // Graisse semi-bold
  },

  // Styles pour le bouton de tri
  actions: {
    marginTop: 10, // Marge supérieure
  },
  singleActionButton: {
    alignItems: 'center', // Centrage horizontal
    justifyContent: 'center', // Centrage vertical
    borderRadius: 14, // Coins arrondis
    paddingVertical: 10, // Padding vertical
    paddingHorizontal: 12, // Padding horizontal
    alignSelf: 'stretch', // Prend toute la largeur disponible
    shadowColor: '#000000', // Couleur de l'ombre
    shadowOffset: { width: 0, height: 8 }, // Décalage de l'ombre
    shadowOpacity: 0.14, // Opacité de l'ombre
    shadowRadius: 10, // Rayon de l'ombre
    elevation: 5, // Élévation pour Android
  },
  singleActionButtonLabel: {
    fontSize: 13, // Taille de police
    fontWeight: '700', // Graisse bold
    letterSpacing: 0.4, // Espacement des lettres
  },
});

export default AppControls;
