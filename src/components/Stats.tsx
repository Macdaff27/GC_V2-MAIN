
/**
 * Importations React et composants nécessaires pour Stats
 */
import React from 'react';
// Importations des composants de base React Native pour l'interface
import { View, StyleSheet, Pressable } from 'react-native';
// Importation du type Palette pour le thème
import type { Palette } from '../types';
// Importation du composant de texte personnalisé
import AppText from '../../AppText';

/**
 * Type définissant les filtres de statut disponibles
 */
type StatusFilter = 'all' | 'in-progress' | 'done';

/**
 * Interface définissant les propriétés du composant Stats
 * Composant d'affichage et de filtrage par statut des clients
 */
interface StatsProps {
  statusFilter: StatusFilter; // Filtre de statut actuellement sélectionné
  onFilterChange: (filter: StatusFilter) => void; // Fonction appelée lors du changement de filtre
  counts: { // Comptages par statut pour affichage
    total: number; // Nombre total de clients
    inProgress: number; // Nombre de clients en cours
    done: number; // Nombre de clients terminés
  };
  palette: Palette; // Palette de couleurs du thème actuel
}

/**
 * Configuration des options de filtrage par statut
 * Chaque option définit l'icône, la clé de filtre et la clé de comptage associée
 */
const filterOptions: Array<{
  key: StatusFilter;
  icon: string;
  countKey: keyof StatsProps['counts'];
}> = [
  { key: 'all', icon: '\uD83D\uDDC2', countKey: 'total' }, // 📂 Tous les clients
  { key: 'in-progress', icon: '\u23F3', countKey: 'inProgress' }, // ⏳ Clients en cours
  { key: 'done', icon: '\u2705', countKey: 'done' }, // ✅ Clients terminés
];

/**
 * Composant Stats - Barre de filtres et statistiques par statut
 * Affiche trois boutons pour filtrer les clients (Tous/En cours/Terminés)
 * avec les comptages correspondants et des icônes explicites
 */
/**
 * Composant Stats - Barre de filtres et statistiques par statut
 * Affiche trois boutons pour filtrer les clients (Tous/En cours/Terminés)
 * avec les comptages correspondants et des icônes explicites
 */
function Stats({ statusFilter, onFilterChange, counts, palette }: StatsProps): React.JSX.Element {
  return (
    // Conteneur horizontal pour la barre de filtres
    <View style={styles.filterBar}>
      {/* Mapping des options de filtrage pour créer les boutons */}
      {filterOptions.map((option) => {
        // Détermination si cette option est actuellement sélectionnée
        const selected = statusFilter === option.key;
        return (
          // Bouton pressable pour chaque option de filtre
          <Pressable
            key={option.key}
            onPress={() => onFilterChange(option.key)}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.filterButton,
              {
                borderColor: palette.accent,
                backgroundColor: selected ? palette.accent : 'transparent',
              },
              pressed && styles.filterButtonPressed,
            ]}
          >
            {/* Contenu du bouton avec icône et comptage */}
            <View style={styles.filterButtonContent}>
              {/* Icône emoji représentant le type de filtre */}
              <AppText
                style={[
                  styles.filterButtonIcon,
                  { color: selected ? palette.background : palette.textPrimary },
                ]}
              >
                {option.icon}
              </AppText>
              {/* Nombre d'éléments pour ce filtre */}
              <AppText
                style={[
                  styles.filterButtonCount,
                  { color: selected ? palette.background : palette.textPrimary },
                ]}
              >
                {counts[option.countKey]}
              </AppText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// Styles CSS-in-JS pour le composant Stats utilisant StyleSheet de React Native
const styles = StyleSheet.create({
  // Conteneur de la barre de filtres - disposition horizontale
  filterBar: {
    flexDirection: 'row', // Alignement horizontal des boutons
    gap: 10, // Espacement entre les boutons
  },
  // Style de base des boutons de filtre
  filterButton: {
    flex: 1, // Chaque bouton prend la même largeur
    borderWidth: 1, // Bordure fine
    borderRadius: 12, // Coins arrondis
    paddingVertical: 8, // Padding vertical
    paddingHorizontal: 10, // Padding horizontal
    alignItems: 'center', // Centrage horizontal du contenu
    justifyContent: 'center', // Centrage vertical du contenu
  },
  // Style appliqué quand le bouton est pressé
  filterButtonPressed: {
    opacity: 0.85, // Légère transparence pour le feedback visuel
  },
  // Conteneur du contenu interne du bouton (icône + texte)
  filterButtonContent: {
    flexDirection: 'row', // Disposition horizontale
    alignItems: 'center', // Alignement vertical centré
    justifyContent: 'center', // Centrage horizontal
    gap: 6, // Petit espacement entre icône et texte
  },
  // Style de l'icône emoji dans le bouton
  filterButtonIcon: {
    fontSize: 16, // Taille de l'icône
  },
  // Style du nombre/comptage dans le bouton
  filterButtonCount: {
    fontSize: 14, // Taille du texte
    fontWeight: '600', // Semi-bold pour mettre en valeur le nombre
  },
});

export default Stats;
