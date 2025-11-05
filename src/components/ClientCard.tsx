/**
 * Importations React et composants nécessaires pour ClientCard
 */
import React from 'react';
// Importations des composants de base React Native pour l'interface
import { View, StyleSheet, Pressable } from 'react-native';
// Importation du composant de texte personnalisé
import AppText from '../../AppText';
// Importation de l'utilitaire de formatage des montants
import { formatCurrency } from '../utils/format';
// Importations des types TypeScript pour le typage strict
import type { ClientWithRelations, Palette, DatabaseName } from '../types';

/**
 * Interface définissant les propriétés du composant ClientCard
 * Ce composant affiche une carte détaillée pour un client avec toutes ses informations
 */
interface ClientCardProps {
  client: ClientWithRelations; // Objet client avec toutes ses relations (frais, téléphones, etc.)
  palette: Palette; // Palette de couleurs du thème actuel
  onToggleStatus: (client: ClientWithRelations) => void; // Fonction pour changer le statut (terminé/en cours)
  onEdit: (client: ClientWithRelations) => void; // Fonction pour éditer le client
  onDelete: (client: ClientWithRelations) => void; // Fonction pour supprimer le client
  activeDatabase: DatabaseName; // Base de données active ('main' ou 'archive')
  onArchive?: (client: ClientWithRelations) => void; // Fonction optionnelle pour archiver (si en base principale)
  onUnarchive?: (client: ClientWithRelations) => void; // Fonction optionnelle pour désarchiver (si en base archive)
}

/**
 * Composant ClientCard - Affiche une carte détaillée pour un client
 * Utilise React.memo pour optimiser les performances en évitant les re-rendus inutiles
 * Affiche toutes les informations du client avec des couleurs dynamiques selon le statut
 */
const ClientCard: React.FC<ClientCardProps> = React.memo(({
  client,
  palette,
  onToggleStatus,
  onEdit,
  onDelete,
  activeDatabase,
  onArchive,
  onUnarchive,
}) => {
  // Détection du mode sombre basée sur la couleur de fond de la palette
  const isDarkMode = palette.background === '#0F172A';

  // Label du statut pour l'affichage
  const statusLabel = client.statut ? 'Terminee' : 'En cours';

  // Couleurs de la carte selon le statut (vert pour terminé, jaune pour en cours)
  const cardColors = client.statut
    ? { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' } // Vert pour terminé
    : { backgroundColor: '#FEF3C7', borderColor: '#FDBA74' }; // Jaune pour en cours

  // Couleur du texte adaptée au thème
  const cardTextColor = isDarkMode ? '#0F172A' : palette.textPrimary;

  // Couleur spéciale pour le montant restant (rouge si > 0)
  const remainingColor = client.montantRestant > 0 ? '#DC2626' : cardTextColor;

  // États calculés pour le bouton de changement de statut
  const toggleTargetDone = !client.statut; // True si on veut marquer comme terminé
  const toggleLabel = toggleTargetDone ? 'Marquer terminee' : 'Marquer en cours';
  const toggleButtonStyle = toggleTargetDone ? styles.statusButtonComplete : styles.statusButtonReopen;
  const toggleButtonTextStyle = toggleTargetDone ? styles.statusButtonTextComplete : styles.statusButtonTextReopen;

  // Structure JSX de rendu de la carte client
  return (
    // Conteneur principal de la carte avec couleurs dynamiques selon le statut
    <View
      style={[
        styles.cardItem,
        cardColors,
      ]}
    >
      {/* Bouton principal pour changer le statut (terminé/en cours) */}
      <Pressable
        onPress={() => onToggleStatus(client)}
        accessibilityRole="button"
        accessibilityLabel={toggleLabel}
        accessibilityHint="Changer le statut de la commande"
        style={({ pressed }) => [
          styles.statusButton,
          toggleButtonStyle,
          pressed ? styles.statusButtonPressed : null,
        ]}
      >
        <AppText style={[styles.statusButtonText, toggleButtonTextStyle]}>{toggleLabel}</AppText>
      </Pressable>

      {/* En-tête avec le nom du client */}
      <View style={styles.cardHeader}>
        <AppText style={[styles.cardTitle, { color: cardTextColor }]}>{client.nom}</AppText>
      </View>

      {/* Métadonnées : page, date d'ajout, statut */}
      <AppText style={[styles.cardMeta, { color: cardTextColor }]}>
        Page {client.page} - Ajoutee le {client.dateAjout} - {statusLabel}
      </AppText>

      {/* Section montants : total et restant */}
      <View style={styles.amountRow}>
        <View style={styles.amountBlock}>
          <AppText style={[styles.amountLabel, { color: cardTextColor }]}>Montant total</AppText>
          <AppText style={[styles.amountValue, { color: cardTextColor }]}>{formatCurrency(client.montantTotal)}</AppText>
        </View>
        <View style={styles.amountBlock}>
          <AppText style={[styles.amountLabel, { color: cardTextColor }]}>Montant restant</AppText>
          <AppText style={[styles.amountValue, { color: remainingColor }]}>{formatCurrency(client.montantRestant)}</AppText>
        </View>
      </View>

      {/* Section frais - affichée seulement s'il y a des frais */}
      {client.frais.length > 0 && (
        <View style={styles.section}>
          <AppText style={[styles.sectionTitle, { color: cardTextColor }]}>Frais</AppText>
          {client.frais.map((fraisItem, index) => (
            <AppText key={`${client.id}-frais-${index}`} style={[styles.sectionItem, { color: cardTextColor }]}>
              - {fraisItem.type} : {formatCurrency(fraisItem.montant)}
            </AppText>
          ))}
        </View>
      )}

      {/* Section téléphones - affichée seulement s'il y a des numéros */}
      {client.telephones.length > 0 && (
        <View style={styles.section}>
          <AppText style={[styles.sectionTitle, { color: cardTextColor }]}>Telephone(s)</AppText>
          {client.telephones.map((phone, index) => (
            <AppText key={`${client.id}-phone-${index}`} style={[styles.sectionItem, { color: cardTextColor }]}>
              - {phone.numero}
            </AppText>
          ))}
        </View>
      )}

      {/* Section archivage/désarchivage selon la base active */}
      <View style={styles.archiveButtonContainer}>
        {activeDatabase === 'main' ? (
          // Bouton d'archivage (base principale)
          <Pressable
            onPress={() => onArchive?.(client)}
            accessibilityRole="button"
            accessibilityLabel={`Archiver ${client.nom}`}
            style={({ pressed }) => [
              styles.archiveButton,
              styles.archiveButtonArchive,
              pressed ? styles.archiveButtonPressed : null,
            ]}
          >
            <AppText style={styles.archiveButtonText}>📦 Archiver</AppText>
          </Pressable>
        ) : (
          // Bouton de désarchivage (base archive)
          <Pressable
            onPress={() => onUnarchive?.(client)}
            accessibilityRole="button"
            accessibilityLabel={`Désarchiver ${client.nom}`}
            style={({ pressed }) => [
              styles.archiveButton,
              styles.archiveButtonUnarchive,
              pressed ? styles.archiveButtonPressed : null,
            ]}
          >
            <AppText style={styles.archiveButtonText}>📋 Désarchiver</AppText>
          </Pressable>
        )}
      </View>

      {/* Section notes - affichée seulement s'il y a une note */}
      {client.note ? (
        <View style={styles.section}>
          <AppText style={[styles.sectionTitle, { color: cardTextColor }]}>Notes</AppText>
          <View
            style={[
              styles.cardNoteContainer,
              { borderColor: palette.surfaceBorder, backgroundColor: palette.searchBackground },
            ]}
          >
            <AppText style={[styles.note, { color: palette.textPrimary }]}>{client.note}</AppText>
          </View>
        </View>
      ) : null}

      {/* Actions principales : modifier et supprimer */}
      <View style={styles.cardActions}>
        <Pressable
          onPress={() => onEdit(client)}
          accessibilityRole="button"
          accessibilityHint="Modifier cette cliente"
          style={({ pressed }) => [
            styles.actionButton,
            styles.actionButtonPrimary,
            pressed ? styles.actionButtonPressed : null,
          ]}
        >
          <AppText style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>Modifier</AppText>
        </Pressable>
        <Pressable
          onPress={() => onDelete(client)}
          accessibilityRole="button"
          accessibilityHint="Supprimer cette cliente"
          style={({ pressed }) => [
            styles.actionButton,
            styles.actionButtonDanger,
            pressed ? styles.actionButtonPressed : null,
          ]}
        >
          <AppText style={[styles.actionButtonText, styles.actionButtonTextDanger]}>Supprimer</AppText>
        </Pressable>
      </View>
    </View>
  );
});

// Styles CSS-in-JS pour le composant ClientCard utilisant StyleSheet de React Native
const styles = StyleSheet.create({
  // Conteneur principal de la carte client
  cardItem: {
    borderRadius: 20, // Coins très arrondis
    borderWidth: 1, // Bordure fine
    padding: 16, // Padding intérieur
    marginBottom: 12, // Marge inférieure entre cartes
    gap: 12, // Espacement entre éléments enfants
  },

  // Styles pour le bouton de changement de statut
  statusButton: {
    alignSelf: 'stretch', // Prend toute la largeur disponible
    borderWidth: 1, // Bordure
    borderRadius: 16, // Coins arrondis
    paddingVertical: 12, // Padding vertical
    paddingHorizontal: 12, // Padding horizontal
    alignItems: 'center', // Centrage horizontal du contenu
    justifyContent: 'center', // Centrage vertical du contenu
  },
  statusButtonPressed: {
    opacity: 0.85, // Légère transparence au press
  },
  statusButtonText: {
    fontSize: 14, // Taille de police
    fontWeight: '700', // Graisse bold
    letterSpacing: 0.3, // Espacement des lettres
  },
  // Styles pour le bouton "Marquer terminé"
  statusButtonComplete: {
    borderColor: '#22C55E', // Bordure verte
    backgroundColor: '#DCFCE7', // Fond vert clair
  },
  statusButtonTextComplete: {
    color: '#166534', // Texte vert foncé
  },
  // Styles pour le bouton "Marquer en cours"
  statusButtonReopen: {
    borderColor: '#D97706', // Bordure orange
    backgroundColor: '#FDE68A', // Fond jaune
  },
  statusButtonTextReopen: {
    color: '#B45309', // Texte orange foncé
  },

  // Styles pour l'en-tête de la carte
  cardHeader: {
    flexDirection: 'row', // Disposition horizontale
    alignItems: 'flex-start', // Alignement en haut
    gap: 12, // Espacement entre éléments
  },
  cardTitle: {
    fontSize: 18, // Taille de police grande
    fontWeight: 'bold', // Texte en gras
  },
  cardMeta: {
    fontSize: 12, // Petite taille pour les métadonnées
    opacity: 0.9, // Légèrement transparent
  },

  // Styles pour la section montants
  amountRow: {
    flexDirection: 'row', // Disposition horizontale
    gap: 16, // Espacement entre les blocs
  },
  amountBlock: {
    flex: 1, // Chaque bloc prend la même largeur
  },
  amountLabel: {
    fontSize: 13, // Taille moyenne
    fontWeight: '600', // Semi-bold
    marginBottom: 8, // Marge inférieure
  },
  amountValue: {
    fontSize: 18, // Grande taille pour les montants
    fontWeight: '700', // Bold
  },

  // Styles pour les sections (frais, téléphones, notes)
  section: {
    paddingTop: 8, // Padding supérieur
    marginTop: 4, // Marge supérieure
    borderTopWidth: 1, // Ligne de séparation
    borderColor: 'rgba(0, 0, 0, 0.1)', // Couleur semi-transparente
    gap: 4, // Espacement entre éléments
  },
  sectionTitle: {
    fontSize: 13, // Taille moyenne
    fontWeight: '600', // Semi-bold
    marginBottom: 2, // Petite marge inférieure
  },
  sectionItem: {
    fontSize: 14, // Taille standard
  },

  // Conteneur pour le bouton d'archivage
  archiveButtonContainer: {
    marginTop: 8, // Marge supérieure
    paddingTop: 8, // Padding supérieur
    borderTopWidth: 1, // Ligne de séparation
    borderColor: 'rgba(0, 0, 0, 0.1)', // Couleur semi-transparente
  },
  archiveButton: {
    paddingVertical: 8, // Padding vertical
    paddingHorizontal: 12, // Padding horizontal
    borderRadius: 10, // Coins arrondis
    alignItems: 'center', // Centrage horizontal
    justifyContent: 'center', // Centrage vertical
  },
  // Styles pour le bouton d'archivage
  archiveButtonArchive: {
    backgroundColor: 'rgba(251, 146, 60, 0.15)', // Fond orange transparent
    borderWidth: 1, // Bordure
    borderColor: '#FB923C', // Bordure orange
  },
  // Styles pour le bouton de désarchivage
  archiveButtonUnarchive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)', // Fond vert transparent
    borderWidth: 1, // Bordure
    borderColor: '#22C55E', // Bordure verte
  },
  archiveButtonPressed: {
    opacity: 0.7, // Transparence au press
  },
  archiveButtonText: {
    fontSize: 13, // Taille moyenne
    fontWeight: '600', // Semi-bold
    color: '#0F172A', // Couleur sombre
  },

  // Conteneur pour les notes
  cardNoteContainer: {
    borderRadius: 12, // Coins arrondis
    padding: 12, // Padding intérieur
    borderWidth: 1, // Bordure
  },
  note: {
    fontSize: 14, // Taille standard
    fontStyle: 'italic', // Style italique pour les notes
  },

  // Conteneur pour les actions principales
  cardActions: {
    flexDirection: 'row', // Disposition horizontale
    gap: 12, // Espacement entre boutons
  },
  actionButton: {
    flex: 1, // Chaque bouton prend la même largeur
    borderWidth: 1, // Bordure
    borderRadius: 16, // Coins arrondis
    paddingVertical: 10, // Padding vertical
    paddingHorizontal: 12, // Padding horizontal
    alignItems: 'center', // Centrage horizontal
    justifyContent: 'center', // Centrage vertical
  },
  actionButtonPressed: {
    opacity: 0.85, // Transparence au press
  },
  actionButtonText: {
    fontSize: 14, // Taille de police
    fontWeight: '700', // Bold
    letterSpacing: 0.3, // Espacement des lettres
  },
  // Styles pour le bouton "Modifier" (bleu)
  actionButtonPrimary: {
    borderColor: '#0EA5E9', // Bordure bleue
    backgroundColor: '#E0F2FE', // Fond bleu clair
  },
  actionButtonTextPrimary: {
    color: '#0369A1', // Texte bleu foncé
  },
  // Styles pour le bouton "Supprimer" (rouge)
  actionButtonDanger: {
    borderColor: '#DC2626', // Bordure rouge
    backgroundColor: '#FEE2E2', // Fond rouge clair
  },
  actionButtonTextDanger: {
    color: '#B91C1C', // Texte rouge foncé
  },
});

export default ClientCard;
