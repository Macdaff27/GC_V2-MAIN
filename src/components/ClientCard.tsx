import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import AppText from '../../AppText';
import { formatCurrency } from '../utils/format';
import type { ClientWithRelations, Palette, DatabaseName } from '../types';

interface ClientCardProps {
  client: ClientWithRelations;
  palette: Palette;
  onToggleStatus: (client: ClientWithRelations) => void;
  onEdit: (client: ClientWithRelations) => void;
  onDelete: (client: ClientWithRelations) => void;
  activeDatabase: DatabaseName;
  onArchive?: (client: ClientWithRelations) => void;
  onUnarchive?: (client: ClientWithRelations) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({
  client,
  palette,
  onToggleStatus,
  onEdit,
  onDelete,
  activeDatabase,
  onArchive,
  onUnarchive,
}) => {
  const isDarkMode = palette.background === '#0F172A';
  const statusLabel = client.statut ? 'Terminee' : 'En cours';
  const cardColors = client.statut
    ? { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }
    : { backgroundColor: '#FEF3C7', borderColor: '#FDBA74' };
  const cardTextColor = isDarkMode ? '#0F172A' : palette.textPrimary;
  const remainingColor = client.montantRestant > 0 ? '#DC2626' : cardTextColor;

  const toggleTargetDone = !client.statut;
  const toggleLabel = toggleTargetDone ? 'Marquer terminee' : 'Marquer en cours';
  const toggleButtonStyle = toggleTargetDone ? styles.statusButtonComplete : styles.statusButtonReopen;
  const toggleButtonTextStyle = toggleTargetDone ? styles.statusButtonTextComplete : styles.statusButtonTextReopen;

  return (
    <View
      style={[
        styles.cardItem,
        cardColors,
      ]}
    >
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

      <View style={styles.cardHeader}>
        <AppText style={[styles.cardTitle, { color: cardTextColor }]}>{client.nom}</AppText>
      </View>
      <AppText style={[styles.cardMeta, { color: cardTextColor }]}>
        Page {client.page} - Ajoutee le {client.dateAjout} - {statusLabel}
      </AppText>

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

      <View style={styles.archiveButtonContainer}>
        {activeDatabase === 'main' ? (
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
};

const styles = StyleSheet.create({
  cardItem: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  statusButton: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusButtonPressed: {
    opacity: 0.85,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statusButtonComplete: {
    borderColor: '#22C55E',
    backgroundColor: '#DCFCE7',
  },
  statusButtonTextComplete: {
    color: '#166534',
  },
  statusButtonReopen: {
    borderColor: '#D97706',
    backgroundColor: '#FDE68A',
  },
  statusButtonTextReopen: {
    color: '#B45309',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardMeta: {
    fontSize: 12,
    opacity: 0.9,
  },
  amountRow: {
    flexDirection: 'row',
    gap: 16,
  },
  amountBlock: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    gap: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  sectionItem: {
    fontSize: 14,
  },
  archiveButtonContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  archiveButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveButtonArchive: {
    backgroundColor: 'rgba(251, 146, 60, 0.15)',
    borderWidth: 1,
    borderColor: '#FB923C',
  },
  archiveButtonUnarchive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  archiveButtonPressed: {
    opacity: 0.7,
  },
  archiveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  cardNoteContainer: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  note: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  actionButtonPrimary: {
    borderColor: '#0EA5E9',
    backgroundColor: '#E0F2FE',
  },
  actionButtonTextPrimary: {
    color: '#0369A1',
  },
  actionButtonDanger: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  actionButtonTextDanger: {
    color: '#B91C1C',
  },
});

export default ClientCard;
