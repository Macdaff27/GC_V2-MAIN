/**
 * COMPOSANT DE TEXTE UNIFORMISÉ POUR L'APPLICATION
 *
 * AppText est un wrapper autour du composant Text de React Native qui :
 * - Applique des styles par défaut cohérents dans toute l'application
 * - Fournit une interface TypeScript typée
 * - Supporte le forwardRef pour l'accès direct au nœud DOM
 * - Permet la personnalisation via les props style
 *
 * Usage recommandé :
 * - Utiliser AppText partout au lieu de Text directement
 * - Personnaliser avec les props style pour les cas spécifiques
 * - Respecter la hiérarchie typographique définie
 */

import React, { forwardRef } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

/**
 * PROPS DU COMPOSANT AppText
 *
 * Hérite de toutes les props du composant Text natif :
 * - style: Style personnalisé (fusionné avec les styles par défaut)
 * - children: Contenu textuel à afficher
 * - numberOfLines: Nombre maximum de lignes
 * - onPress: Gestionnaire d'événement tactile
 * - etc. (toutes les props TextProps)
 */
type AppTextProps = TextProps;

/**
 * COMPOSANT AppText - Wrapper typé du Text natif
 *
 * Fonctionnalités :
 * - Forward ref pour l'accès direct au nœud Text
 * - Fusion intelligente des styles (défaut + personnalisé)
 * - Interface TypeScript complète
 * - Performance optimisée avec StyleSheet
 */
const AppText = forwardRef<Text, AppTextProps>(({ style, children, ...rest }, ref) => {
  return (
    <Text ref={ref} {...rest} style={[styles.text, style]}>
      {children}
    </Text>
  );
});

/**
 * NOM D'AFFICHAGE POUR LE DEBUGGING
 *
 * Définit le nom du composant dans les outils de développement React.
 * Utile pour l'inspection et le debugging des arbres de composants.
 */
AppText.displayName = 'AppText';

/**
 * FEUILLE DE STYLES OPTIMISÉE
 *
 * Utilise StyleSheet.create() pour :
 * - Optimiser les performances (styles pré-calculés)
 * - Valider les propriétés CSS à la compilation
 * - Fournir des IDs numériques aux styles (meilleure perf)
 */
const styles = StyleSheet.create({
  text: {
    /**
     * POLICE PAR DÉFAUT : Monospace
     *
     * Choix de conception :
     * - Lisibilité uniforme pour les chiffres et codes
     * - Aspect technique cohérent avec l'app de gestion
     * - Large support cross-platform
     * - Peut être surchargé par les props style si nécessaire
     */
    fontFamily: 'monospace',
  },
});

/**
 * EXPORT PAR DÉFAUT
 *
 * Permet l'importation simple :
 * import AppText from './AppText';
 */
export default AppText;
