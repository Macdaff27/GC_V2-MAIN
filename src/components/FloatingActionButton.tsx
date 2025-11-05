/**
 * Importations React et composants nécessaires pour FloatingActionButton
 */
import React from 'react';
// Importations des composants de base React Native pour l'interface
import { Pressable, StyleSheet } from 'react-native';

// Importation du composant de texte personnalisé
import AppText from '../../AppText';
// Importation du type Palette pour le thème
import type { Palette } from '../types';

/**
 * Interface définissant les propriétés du composant FloatingActionButton
 * Bouton d'action flottant standard selon les guidelines Material Design
 */
type FloatingActionButtonProps = {
  onPress: () => void; // Fonction appelée lors du press sur le bouton
  palette: Palette; // Palette de couleurs du thème actuel
  accessibilityLabel?: string; // Label optionnel pour l'accessibilité
};

/**
 * Composant FloatingActionButton - Bouton d'action flottant
 * Utilise React.memo pour optimiser les performances en évitant les re-rendus inutiles
 * Bouton circulaire positionné en bas à droite selon les conventions Material Design
 */
const FloatingActionButton = React.memo(({
  onPress,
  palette,
  accessibilityLabel,
}: FloatingActionButtonProps): React.JSX.Element => (
  // Conteneur Pressable avec gestion des états pressed et accessibilité
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    style={({ pressed }) => [
      styles.fab,
      { backgroundColor: palette.accent, opacity: pressed ? 0.85 : 1 },
    ]}
  >
    {/* Symbole plus centré dans le bouton */}
    <AppText style={[styles.fabLabel, { color: palette.background }]}>+</AppText>
  </Pressable>
));

// Styles CSS-in-JS pour le composant FloatingActionButton utilisant StyleSheet de React Native
const styles = StyleSheet.create({
  // Style principal du bouton d'action flottant
  fab: {
    position: 'absolute', // Positionnement absolu par rapport au conteneur parent
    right: 24, // Distance depuis le bord droit
    bottom: 32, // Distance depuis le bord inférieur
    width: 60, // Largeur du bouton
    height: 60, // Hauteur du bouton
    borderRadius: 30, // Rayon pour créer un cercle parfait
    alignItems: 'center', // Centrage horizontal du contenu
    justifyContent: 'center', // Centrage vertical du contenu
    shadowColor: '#000000', // Couleur de l'ombre
    shadowOffset: { width: 0, height: 6 }, // Décalage de l'ombre
    shadowOpacity: 0.18, // Opacité de l'ombre
    shadowRadius: 8, // Rayon de l'ombre (iOS)
    elevation: 8, // Élévation pour Android
  },
  // Style du symbole plus dans le bouton
  fabLabel: {
    fontSize: 32, // Grande taille pour le symbole plus
    fontWeight: '700', // Très gras
    marginTop: -4, // Ajustement vertical pour centrer le symbole
  },
});

export default FloatingActionButton;
