/**
 * Importations React et composants nécessaires pour ClientFormModal
 */
import React, { useCallback, useEffect, useState } from 'react';
// Importations des composants React Native pour l'interface du formulaire
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
// Importation du sélecteur de date
import DateTimePicker from '@react-native-community/datetimepicker';
// Importation pour gérer les zones sûres de l'écran
import { SafeAreaView } from 'react-native-safe-area-context';

// Importation du composant de texte personnalisé
import AppText from '../../AppText';
// Importation de l'utilitaire de formatage des dates
import {
  formatDate,
} from '../utils/format';
// Importations des types TypeScript pour le typage strict
import type {
  ClientFormFee,
  ClientFormModalProps,
  ClientFormPhone,
  ClientFormValues,
  ClientWithRelations,
  Fee,
  Phone,
} from '../types';

/**
 * Fonctions utilitaires pour la gestion des formulaires
 */

// Génère une clé unique pour identifier les éléments de formulaire dynamiques
const createUniqueKey = (): string => Math.random().toString(36).slice(2, 10);

// Crée un objet frais vide pour le formulaire
const createEmptyFee = (): ClientFormFee => ({
  key: createUniqueKey(),
  type: '',
  montant: '',
});

// Crée un objet téléphone vide pour le formulaire
const createEmptyPhone = (): ClientFormPhone => ({
  key: createUniqueKey(),
  numero: '',
});

/**
 * Crée des valeurs de formulaire vides pour l'ajout d'un nouveau client
 */
export const createEmptyFormValues = (): ClientFormValues => ({
  nom: '',
  page: '',
  note: '',
  montantTotal: '',
  montantRestant: '',
  dateAjout: formatDate(new Date()), // Date du jour formatée
  statut: false, // Par défaut : en cours
  frais: [createEmptyFee()], // Au moins un frais vide
  telephones: [createEmptyPhone()], // Au moins un téléphone vide
});

/**
 * Convertit un objet ClientWithRelations en valeurs de formulaire pour l'édition
 */
export const createFormValuesFromClient = (client: ClientWithRelations): ClientFormValues => ({
  id: client.id,
  nom: client.nom,
  page: client.page.toString(),
  note: client.note,
  montantTotal: client.montantTotal.toString(),
  montantRestant: client.montantRestant.toString(),
  dateAjout: client.dateAjout,
  statut: client.statut,
  frais: (client.frais.length > 0 ? client.frais : [{ type: '', montant: 0 } as Fee]).map((fee) => ({
    key: createUniqueKey(),
    type: fee.type,
    montant: fee.montant.toString(),
  })),
  telephones: (client.telephones.length > 0 ? client.telephones : [{ numero: '' } as Phone]).map((phone) => ({
    key: createUniqueKey(),
    numero: phone.numero,
  })),
});

/**
 * Composant ClientFormModal - Modal de formulaire pour créer/éditer un client
 * Gère un formulaire complexe avec champs dynamiques pour frais et téléphones
 * Supporte l'ajout et l'édition avec validation et gestion d'état
 */
function ClientFormModal({
  visible,
  palette,
  initialValues,
  submitting,
  onClose,
  onSubmit,
}: ClientFormModalProps) {
  // État du formulaire - valeurs actuelles des champs
  const [formValues, setFormValues] = useState<ClientFormValues>(initialValues ?? createEmptyFormValues());

  // État pour contrôler l'affichage du sélecteur de date
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Valeur actuelle du sélecteur de date (objet Date)
  const [datePickerValue, setDatePickerValue] = useState<Date>(() => {
    const [d, m, y] = (formValues.dateAjout || '').split('/').map(Number);
    const parsed = y && m && d ? new Date(y, m - 1, d) : new Date();
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  });

  /**
   * Effet pour réinitialiser le formulaire quand il devient visible
   * Met à jour les valeurs et le sélecteur de date selon les initialValues
   */
  useEffect(() => {
    if (visible) {
      setFormValues(initialValues ?? createEmptyFormValues());
      const next = initialValues ?? createEmptyFormValues();
      const [d, m, y] = (next.dateAjout || '').split('/').map(Number);
      const parsed = y && m && d ? new Date(y, m - 1, d) : new Date();
      setDatePickerValue(Number.isNaN(parsed.getTime()) ? new Date() : parsed);
    }
  }, [initialValues, visible]);

  /**
   * Gestionnaire de changement pour les champs simples du formulaire
   */
  const handleFieldChange = useCallback((field: 'nom' | 'page' | 'note' | 'montantTotal' | 'montantRestant' | 'dateAjout', value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  /**
   * Gestionnaire pour le changement du statut (terminé/en cours)
   */
  const handleToggleStatut = useCallback((value: boolean) => {
    setFormValues((prev) => ({
      ...prev,
      statut: value,
    }));
  }, []);

  /**
   * Gestionnaire de changement pour les champs d'un frais spécifique
   */
  const handleFeeChange = useCallback((key: string, field: 'type' | 'montant', value: string) => {
    setFormValues((prev) => ({
      ...prev,
      frais: prev.frais.map((fee) => (fee.key === key ? { ...fee, [field]: value } : fee)),
    }));
  }, []);

  /**
   * Gestionnaire pour ajouter un nouveau frais au formulaire
   */
  const handleAddFee = useCallback(() => {
    setFormValues((prev) => ({
      ...prev,
      frais: [...prev.frais, createEmptyFee()],
    }));
  }, []);

  /**
   * Gestionnaire pour supprimer un frais (garde au moins un frais vide)
   */
  const handleRemoveFee = useCallback((key: string) => {
    setFormValues((prev) => {
      const next = prev.frais.filter((fee) => fee.key !== key);
      return {
        ...prev,
        frais: next.length > 0 ? next : [createEmptyFee()],
      };
    });
  }, []);

  /**
   * Gestionnaire de changement pour le numéro de téléphone
   */
  const handlePhoneChange = useCallback((key: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      telephones: prev.telephones.map((phone) => (phone.key === key ? { ...phone, numero: value } : phone)),
    }));
  }, []);

  /**
   * Gestionnaire pour ajouter un nouveau numéro de téléphone
   */
  const handleAddPhone = useCallback(() => {
    setFormValues((prev) => ({
      ...prev,
      telephones: [...prev.telephones, createEmptyPhone()],
    }));
  }, []);

  /**
   * Gestionnaire pour supprimer un numéro de téléphone (garde au moins un téléphone vide)
   */
  const handleRemovePhone = useCallback((key: string) => {
    setFormValues((prev) => {
      const next = prev.telephones.filter((phone) => phone.key !== key);
      return {
        ...prev,
        telephones: next.length > 0 ? next : [createEmptyPhone()],
      };
    });
  }, []);

  /**
   * Gestionnaire de soumission du formulaire
   */
  const handleSubmit = useCallback(() => {
    if (submitting) {
      return;
    }
    onSubmit(formValues);
  }, [formValues, onSubmit, submitting]);

  /**
   * Gestionnaire de fermeture du modal (avec protection contre la fermeture pendant soumission)
   */
  const handleRequestClose = useCallback(() => {
    if (submitting) {
      return;
    }
    onClose();
  }, [onClose, submitting]);

  // Structure JSX du rendu du modal de formulaire
  return (
    // Modal plein écran avec animation de glissement
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleRequestClose}
    >
      {/* Conteneur avec zones sûres pour éviter les encoches/notch */}
      <SafeAreaView
        style={[
          styles.modalOverlay,
          { backgroundColor: palette.background },
        ]}
      >
        {/* Gestion de l'évitement du clavier selon la plateforme */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalWrapper}
        >
          {/* Carte principale du modal avec fond dynamique */}
          <View
            style={[
              styles.modalCard,
              { backgroundColor: palette.surface, borderColor: palette.surfaceBorder },
            ]}
          >
            {/* En-tête du modal avec titre et bouton de fermeture */}
            <View style={styles.modalHeader}>
              <AppText style={[styles.modalTitle, { color: palette.textPrimary }]}>
                {formValues.id ? 'Modifier une cliente' : 'Ajouter une cliente'}
              </AppText>
              <Pressable
                onPress={handleRequestClose}
                disabled={submitting}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.modalCloseButton,
                  pressed ? styles.modalCloseButtonPressed : null,
                  submitting ? styles.modalCloseButtonDisabled : null,
                ]}
              >
                <AppText style={[styles.modalCloseButtonText, { color: palette.textSecondary }]}>Fermer</AppText>
              </Pressable>
            </View>

            {/* Zone de défilement pour le contenu du formulaire */}
            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.modalContentContainer}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalSection}>
                <AppText style={[styles.modalLabel, { color: palette.textSecondary }]}>Nom</AppText>
                <TextInput
                  value={formValues.nom}
                  onChangeText={(value) => handleFieldChange('nom', value)}
                  style={[
                    styles.modalInput,
                    {
                      color: palette.textPrimary,
                      borderColor: palette.surfaceBorder,
                      backgroundColor: palette.searchBackground,
                    },
                  ]}
                  placeholder="Nom de la cliente"
                  placeholderTextColor={palette.searchPlaceholder}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.modalRow}>
                <View style={styles.modalRowItem}>
                  <AppText style={[styles.modalLabel, { color: palette.textSecondary }]}>Page</AppText>
                  <TextInput
                    value={formValues.page}
                    onChangeText={(value) => handleFieldChange('page', value)}
                    style={[
                      styles.modalInput,
                      {
                        color: palette.textPrimary,
                        borderColor: palette.surfaceBorder,
                        backgroundColor: palette.searchBackground,
                      },
                    ]}
                    keyboardType="numeric"
                    placeholder="Numero"
                    placeholderTextColor={palette.searchPlaceholder}
                  />
                </View>
                <View style={styles.modalRowItem}>
                  <AppText style={[styles.modalLabel, { color: palette.textSecondary }]}>Date</AppText>
                  <Pressable onPress={() => setShowDatePicker(true)}>
                    <TextInput
                      value={formValues.dateAjout}
                      editable={false}
                      pointerEvents="none"
                      style={[
                        styles.modalInput,
                        {
                          color: palette.textPrimary,
                          borderColor: palette.surfaceBorder,
                          backgroundColor: palette.searchBackground,
                        },
                      ]}
                      placeholder="JJ/MM/AAAA"
                      placeholderTextColor={palette.searchPlaceholder}
                    />
                  </Pressable>
                  {showDatePicker && (
                    <DateTimePicker
                      value={datePickerValue}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(_event, selectedDate) => {
                        if (!selectedDate) {
                          setShowDatePicker(false);
                          return;
                        }
                        setDatePickerValue(selectedDate);
                        setFormValues((prev) => ({ ...prev, dateAjout: formatDate(selectedDate) }));
                        if (Platform.OS === 'android') {
                          setShowDatePicker(false);
                        }
                      }}
                    />
                  )}
                </View>
              </View>

              <View style={styles.modalSection}>
                <AppText style={[styles.modalLabel, { color: palette.textSecondary }]}>Montant de la commande</AppText>
                <TextInput
                  value={formValues.montantTotal}
                  onChangeText={(value) => handleFieldChange('montantTotal', value)}
                  style={[
                    styles.modalInput,
                    {
                      color: palette.textPrimary,
                      borderColor: palette.surfaceBorder,
                      backgroundColor: palette.searchBackground,
                    },
                  ]}
                  keyboardType="numeric"
                  placeholder="Montant"
                  placeholderTextColor={palette.searchPlaceholder}
                />
              </View>

              <View style={styles.modalSection}>
                <AppText style={[styles.modalLabel, { color: palette.textSecondary }]}>Montant restant</AppText>
                <TextInput
                  value={formValues.montantRestant}
                  onChangeText={(value) => handleFieldChange('montantRestant', value)}
                  style={[
                    styles.modalInput,
                    {
                      color: palette.textPrimary,
                      borderColor: palette.surfaceBorder,
                      backgroundColor: palette.searchBackground,
                    },
                  ]}
                  keyboardType="numeric"
                  placeholder="Montant"
                  placeholderTextColor={palette.searchPlaceholder}
                />
              </View>

              <View style={styles.modalSection}>
                <AppText style={[styles.modalLabel, { color: palette.textSecondary }]}>Note</AppText>
                <TextInput
                  value={formValues.note}
                  onChangeText={(value) => handleFieldChange('note', value)}
                  style={[
                    styles.modalTextarea,
                    {
                      color: palette.textPrimary,
                      borderColor: palette.surfaceBorder,
                      backgroundColor: palette.searchBackground,
                    },
                  ]}
                  placeholder="Note"
                  placeholderTextColor={palette.searchPlaceholder}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.modalSwitchRow}>
                <AppText style={[styles.modalSwitchLabel, { color: palette.textSecondary }]}>Commande terminee</AppText>
                <Switch
                  value={formValues.statut}
                  onValueChange={handleToggleStatut}
                  trackColor={{ false: palette.trackOff, true: palette.trackOn }}
                  thumbColor={formValues.statut ? palette.thumbOn : palette.thumbOff}
                />
              </View>

              <View style={styles.modalSection}>
                <View style={styles.modalRepeaterHeader}>
                  <AppText style={[styles.modalLabel, { color: palette.textSecondary }]}>Frais</AppText>
                  <Pressable
                    onPress={handleAddFee}
                    style={({ pressed }) => [
                      styles.modalAddButton,
                      pressed ? styles.modalAddButtonPressed : null,
                    ]}
                  >
                    <AppText style={[styles.modalAddButtonText, { color: palette.accent }]}>Ajouter un frais</AppText>
                  </Pressable>
                </View>
                {formValues.frais.map((fee, index) => (
                  <View key={fee.key} style={styles.modalItemRow}>
                    <View style={styles.modalItemInputs}>
                      <TextInput
                        value={fee.type}
                        onChangeText={(value) => handleFeeChange(fee.key, 'type', value)}
                        style={[
                          styles.modalInput,
                          styles.modalFeeTypeInput,
                          {
                            color: palette.textPrimary,
                            borderColor: palette.surfaceBorder,
                            backgroundColor: palette.searchBackground,
                          },
                        ]}
                        placeholder={`Type ${index + 1}`}
                        placeholderTextColor={palette.searchPlaceholder}
                      />
                      <TextInput
                        value={fee.montant}
                        onChangeText={(value) => handleFeeChange(fee.key, 'montant', value)}
                        style={[
                          styles.modalInput,
                          styles.modalFeeAmountInput,
                          {
                            color: palette.textPrimary,
                            borderColor: palette.surfaceBorder,
                            backgroundColor: palette.searchBackground,
                          },
                        ]}
                        keyboardType="numeric"
                        placeholder="Montant"
                        placeholderTextColor={palette.searchPlaceholder}
                      />
                    </View>
                    <Pressable
                      onPress={() => handleRemoveFee(fee.key)}
                      style={({ pressed }) => [
                        styles.modalRemoveButton,
                        pressed ? styles.modalRemoveButtonPressed : null,
                      ]}
                    >
                      <AppText style={styles.modalRemoveButtonText}>Supprimer</AppText>
                    </Pressable>
                  </View>
                ))}
              </View>

              <View style={styles.modalSection}>
                <View style={styles.modalRepeaterHeader}>
                  <AppText style={[styles.modalLabel, { color: palette.textSecondary }]}>Telephones</AppText>
                  <Pressable
                    onPress={handleAddPhone}
                    style={({ pressed }) => [
                      styles.modalAddButton,
                      pressed ? styles.modalAddButtonPressed : null,
                    ]}
                  >
                    <AppText style={[styles.modalAddButtonText, { color: palette.accent }]}>Ajouter un numero</AppText>
                  </Pressable>
                </View>
                {formValues.telephones.map((phone, index) => (
                  <View key={phone.key} style={styles.modalItemRow}>
                    <View style={styles.modalItemInputs}>
                      <TextInput
                        value={phone.numero}
                        onChangeText={(value) => handlePhoneChange(phone.key, value)}
                        style={[
                          styles.modalInput,
                          styles.modalPhoneInput,
                          {
                            color: palette.textPrimary,
                            borderColor: palette.surfaceBorder,
                            backgroundColor: palette.searchBackground,
                          },
                        ]}
                        placeholder={`Numero ${index + 1}`}
                        placeholderTextColor={palette.searchPlaceholder}
                        keyboardType="phone-pad"
                      />
                    </View>
                    <Pressable
                      onPress={() => handleRemovePhone(phone.key)}
                      style={({ pressed }) => [
                        styles.modalRemoveButton,
                        pressed ? styles.modalRemoveButtonPressed : null,
                      ]}
                    >
                      <AppText style={styles.modalRemoveButtonText}>Supprimer</AppText>
                    </Pressable>
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                onPress={handleRequestClose}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.modalActionButton,
                  styles.modalActionButtonSecondary,
                  pressed ? styles.modalActionButtonPressed : null,
                  submitting ? styles.modalActionButtonDisabled : null,
                ]}
              >
                <AppText style={[styles.modalActionButtonText, styles.modalActionButtonTextSecondary]}>
                  Annuler
                </AppText>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.modalActionButton,
                  styles.modalActionButtonPrimary,
                  pressed ? styles.modalActionButtonPressed : null,
                  submitting ? styles.modalActionButtonDisabled : null,
                ]}
              >
                <AppText style={[styles.modalActionButtonText, styles.modalActionButtonTextPrimary]}>
                  {formValues.id ? 'Mettre a jour' : 'Ajouter'}
                </AppText>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

/**
 * Styles CSS-in-JS pour le composant ClientFormModal utilisant StyleSheet de React Native
 * Définit l'apparence complète du modal de formulaire avec tous ses éléments
 */
const styles = StyleSheet.create({
  // Fond du modal qui couvre tout l'écran
  modalOverlay: {
    flex: 1, // Prend tout l'espace disponible
  },
  // Conteneur pour la gestion du clavier
  modalWrapper: {
    flex: 1, // Prend tout l'espace disponible
  },
  // Carte principale du modal (contenu principal)
  modalCard: {
    flex: 1, // Prend tout l'espace disponible
    borderRadius: 0, // Pas de coins arrondis (plein écran)
    borderWidth: 0, // Pas de bordure
    overflow: 'hidden', // Cache le contenu qui dépasse
  },
  // En-tête du modal avec titre et bouton de fermeture
  modalHeader: {
    flexDirection: 'row', // Disposition horizontale
    alignItems: 'center', // Alignement vertical centré
    justifyContent: 'space-between', // Espace entre les éléments
    paddingHorizontal: 24, // Padding horizontal
    paddingTop: 24, // Padding supérieur
    paddingBottom: 16, // Padding inférieur
  },
  modalTitle: {
    fontSize: 20, // Taille de police grande
    fontWeight: '700', // Très gras
  },
  // Bouton de fermeture du modal
  modalCloseButton: {
    paddingVertical: 6, // Padding vertical
    paddingHorizontal: 12, // Padding horizontal
    borderRadius: 999, // Arrondi complet
    borderWidth: 1, // Bordure fine
    borderColor: 'transparent', // Bordure transparente
  },
  modalCloseButtonPressed: {
    opacity: 0.75, // Transparence au press
  },
  modalCloseButtonDisabled: {
    opacity: 0.5, // Transparence quand désactivé
  },
  modalCloseButtonText: {
    fontSize: 14, // Taille moyenne
    fontWeight: '600', // Semi-bold
  },
  // Conteneur du contenu défilant
  modalContent: {
    paddingHorizontal: 24, // Padding horizontal
  },
  modalContentContainer: {
    paddingBottom: 24, // Padding inférieur
    gap: 16, // Espacement entre sections
  },
  // Section générique du formulaire
  modalSection: {
    gap: 8, // Espacement entre label et input
  },
  // Label des champs de formulaire
  modalLabel: {
    fontSize: 14, // Taille moyenne
    fontWeight: '600', // Semi-bold
    letterSpacing: 0.3, // Espacement des lettres
  },
  // Style de base des inputs de formulaire
  modalInput: {
    borderWidth: 1, // Bordure
    borderRadius: 14, // Coins arrondis
    paddingVertical: 10, // Padding vertical
    paddingHorizontal: 14, // Padding horizontal
    fontSize: 15, // Taille de police
    fontWeight: '600', // Semi-bold
  },
  // Style spécifique pour les zones de texte multiligne
  modalTextarea: {
    borderWidth: 1, // Bordure
    borderRadius: 18, // Coins plus arrondis
    paddingVertical: 12, // Padding vertical plus grand
    paddingHorizontal: 14, // Padding horizontal
    fontSize: 15, // Taille de police
    fontWeight: '500', // Moyen
    minHeight: 120, // Hauteur minimale
  },
  modalRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalRowItem: {
    flex: 1,
    gap: 8,
  },
  modalSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalSwitchLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalRepeaterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalAddButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  modalAddButtonPressed: {
    opacity: 0.85,
  },
  modalAddButtonText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  modalItemRow: {
    gap: 8,
    marginBottom: 12,
  },
  modalItemInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  modalFeeTypeInput: {
    flex: 1,
  },
  modalFeeAmountInput: {
    flex: 0.6,
  },
  modalPhoneInput: {
    flex: 1,
  },
  modalRemoveButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  modalRemoveButtonPressed: {
    opacity: 0.85,
  },
  modalRemoveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  modalActionButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalActionButtonPrimary: {
    borderColor: '#0EA5E9',
    backgroundColor: '#0EA5E9',
  },
  modalActionButtonSecondary: {
    borderColor: 'rgba(148, 163, 184, 0.6)',
    backgroundColor: 'transparent',
  },
  modalActionButtonDisabled: {
    opacity: 0.6,
  },
  modalActionButtonPressed: {
    opacity: 0.85,
  },
  modalActionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modalActionButtonTextSecondary: {
    color: '#475569',
  },
  modalActionButtonTextPrimary: {
    color: '#0F172A',
  },
});

export default ClientFormModal;
