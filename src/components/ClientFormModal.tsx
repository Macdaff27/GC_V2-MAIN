import React, { useCallback, useEffect, useState } from 'react';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppText from '../../AppText';
import {
  formatDate,
} from '../utils/format';
import type {
  ClientFormFee,
  ClientFormModalProps,
  ClientFormPhone,
  ClientFormValues,
  ClientWithRelations,
  Fee,
  Phone,
} from '../types';

const createUniqueKey = (): string => Math.random().toString(36).slice(2, 10);

const createEmptyFee = (): ClientFormFee => ({
  key: createUniqueKey(),
  type: '',
  montant: '',
});

const createEmptyPhone = (): ClientFormPhone => ({
  key: createUniqueKey(),
  numero: '',
});

export const createEmptyFormValues = (): ClientFormValues => ({
  nom: '',
  page: '',
  note: '',
  montantTotal: '',
  montantRestant: '',
  dateAjout: formatDate(new Date()),
  statut: false,
  frais: [createEmptyFee()],
  telephones: [createEmptyPhone()],
});

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

function ClientFormModal({
  visible,
  palette,
  initialValues,
  submitting,
  onClose,
  onSubmit,
}: ClientFormModalProps) {
  const [formValues, setFormValues] = useState<ClientFormValues>(initialValues ?? createEmptyFormValues());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerValue, setDatePickerValue] = useState<Date>(() => {
    const [d, m, y] = (formValues.dateAjout || '').split('/').map(Number);
    const parsed = y && m && d ? new Date(y, m - 1, d) : new Date();
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  });

  useEffect(() => {
    if (visible) {
      setFormValues(initialValues ?? createEmptyFormValues());
      const next = initialValues ?? createEmptyFormValues();
      const [d, m, y] = (next.dateAjout || '').split('/').map(Number);
      const parsed = y && m && d ? new Date(y, m - 1, d) : new Date();
      setDatePickerValue(Number.isNaN(parsed.getTime()) ? new Date() : parsed);
    }
  }, [initialValues, visible]);

  const handleFieldChange = useCallback((field: 'nom' | 'page' | 'note' | 'montantTotal' | 'montantRestant' | 'dateAjout', value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleToggleStatut = useCallback((value: boolean) => {
    setFormValues((prev) => ({
      ...prev,
      statut: value,
    }));
  }, []);

  const handleFeeChange = useCallback((key: string, field: 'type' | 'montant', value: string) => {
    setFormValues((prev) => ({
      ...prev,
      frais: prev.frais.map((fee) => (fee.key === key ? { ...fee, [field]: value } : fee)),
    }));
  }, []);

  const handleAddFee = useCallback(() => {
    setFormValues((prev) => ({
      ...prev,
      frais: [...prev.frais, createEmptyFee()],
    }));
  }, []);

  const handleRemoveFee = useCallback((key: string) => {
    setFormValues((prev) => {
      const next = prev.frais.filter((fee) => fee.key !== key);
      return {
        ...prev,
        frais: next.length > 0 ? next : [createEmptyFee()],
      };
    });
  }, []);

  const handlePhoneChange = useCallback((key: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      telephones: prev.telephones.map((phone) => (phone.key === key ? { ...phone, numero: value } : phone)),
    }));
  }, []);

  const handleAddPhone = useCallback(() => {
    setFormValues((prev) => ({
      ...prev,
      telephones: [...prev.telephones, createEmptyPhone()],
    }));
  }, []);

  const handleRemovePhone = useCallback((key: string) => {
    setFormValues((prev) => {
      const next = prev.telephones.filter((phone) => phone.key !== key);
      return {
        ...prev,
        telephones: next.length > 0 ? next : [createEmptyPhone()],
      };
    });
  }, []);

  const handleSubmit = useCallback(() => {
    if (submitting) {
      return;
    }
    onSubmit(formValues);
  }, [formValues, onSubmit, submitting]);

  const handleRequestClose = useCallback(() => {
    if (submitting) {
      return;
    }
    onClose();
  }, [onClose, submitting]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleRequestClose}
    >
      <SafeAreaView
        style={[
          styles.modalOverlay,
          { backgroundColor: palette.background },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalWrapper}
        >
          <View
            style={[
              styles.modalCard,
              { backgroundColor: palette.surface, borderColor: palette.surfaceBorder },
            ]}
          >
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

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  modalWrapper: {
    flex: 1,
  },
  modalCard: {
    flex: 1,
    borderRadius: 0,
    borderWidth: 0,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalCloseButtonPressed: {
    opacity: 0.75,
  },
  modalCloseButtonDisabled: {
    opacity: 0.5,
  },
  modalCloseButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalContent: {
    paddingHorizontal: 24,
  },
  modalContentContainer: {
    paddingBottom: 24,
    gap: 16,
  },
  modalSection: {
    gap: 8,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '600',
  },
  modalTextarea: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '500',
    minHeight: 120,
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
