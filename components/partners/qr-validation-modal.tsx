import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { responsiveSpacing } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface QrValidationModalProps {
  visible: boolean;
  onClose: () => void;
  onValidate: (amountGross: number, personsCount: number) => void;
  partnerId: string;
  storeId: string;
  operatorUserId: string;
  qrToken: string;
  storeName?: string;
  discountPercent?: number;
  isValidating?: boolean;
}

export function QrValidationModal({
  visible,
  onClose,
  onValidate,
  partnerId,
  storeId,
  operatorUserId,
  qrToken,
  storeName,
  discountPercent,
  isValidating = false,
}: QrValidationModalProps) {
  const [amountGross, setAmountGross] = useState('');
  const [personsCount, setPersonsCount] = useState('1');

  // Calculer le montant net et l'économie
  const calculateAmounts = () => {
    const amount = parseFloat(amountGross) || 0;
    const discount = discountPercent ?? 10;
    const discountAmount = (amount * discount) / 100;
    const amountNet = amount - discountAmount;
    return { amount, discountAmount, amountNet };
  };

  const { amount, discountAmount, amountNet } = calculateAmounts();

  const handleValidate = () => {
    // Validation des champs
    const amount = parseFloat(amountGross);
    const persons = parseInt(personsCount, 10);

    if (!amountGross || isNaN(amount) || amount < 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    if (!personsCount || isNaN(persons) || persons < 1) {
      Alert.alert('Erreur', 'Le nombre de personnes doit être au moins 1');
      return;
    }

    console.log('✅ [QR Validation Modal] Validation avec:', {
      amountGross: amount,
      personsCount: persons,
    });

    onValidate(amount, persons);
  };

  const handleCancel = () => {
    setAmountGross('');
    setPersonsCount('1');
    onClose();
  };

  const incrementPersons = () => {
    const current = parseInt(personsCount, 10) || 1;
    setPersonsCount(String(current + 1));
  };

  const decrementPersons = () => {
    const current = parseInt(personsCount, 10) || 1;
    if (current > 1) {
      setPersonsCount(String(current - 1));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="qr-code" size={24} color="#8B2F3F" />
                </View>
                <Text style={styles.modalTitle}>Validation du QR Code</Text>
              </View>
              <TouchableOpacity
                onPress={handleCancel}
                style={styles.closeButton}
                disabled={isValidating}
              >
                <Ionicons name="close" size={28} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Informations QR Code */}
              {storeName && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Magasin</Text>

                  <View style={styles.storeCard}>
                    <View style={styles.storeIconContainer}>
                      <Ionicons name="storefront" size={32} color="#8B2F3F" />
                    </View>
                    <Text style={styles.storeName}>{storeName}</Text>
                  </View>
                </View>
              )}

              {/* Formulaire de saisie */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informations de la transaction</Text>

                {/* Montant */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>
                    Montant total <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="cash-outline" size={24} color="#8B2F3F" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={amountGross}
                      onChangeText={setAmountGross}
                      placeholder="0.00"
                      placeholderTextColor={Colors.text.secondary}
                      keyboardType="decimal-pad"
                      editable={!isValidating}
                    />
                    <Text style={styles.currency}>€</Text>
                  </View>
                  <Text style={styles.hint}>Montant total avant réduction</Text>
                </View>

                {/* Affichage de la réduction et montant net */}
                {amount > 0 && (
                  <View style={styles.calculationCard}>
                    <View style={styles.calculationRow}>
                      <View style={styles.calculationLabel}>
                        <Ionicons name="pricetag" size={16} color="#10B981" />
                        <Text style={styles.calculationLabelText}>Réduction</Text>
                      </View>
                      <View style={styles.calculationValue}>
                        <Text style={styles.discountPercent}>-{discountPercent ?? 10}%</Text>
                        <Text style={styles.discountAmount}>-{discountAmount.toFixed(2)}€</Text>
                      </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.calculationRow}>
                      <View style={styles.calculationLabel}>
                        <Ionicons name="cash" size={16} color="#8B2F3F" />
                        <Text style={styles.calculationLabelText}>Montant net</Text>
                      </View>
                      <Text style={styles.amountNetValue}>{amountNet.toFixed(2)}€</Text>
                    </View>
                  </View>
                )}

                {/* Nombre de personnes */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>
                    Nombre de personnes <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.counterContainer}>
                    <TouchableOpacity
                      style={[styles.counterButton, personsCount === '1' && styles.counterButtonDisabled]}
                      onPress={decrementPersons}
                      disabled={isValidating || personsCount === '1'}
                    >
                      <Ionicons name="remove" size={24} color={personsCount === '1' ? Colors.text.muted : '#8B2F3F'} />
                    </TouchableOpacity>

                    <View style={styles.counterValueContainer}>
                      <Ionicons name="people" size={24} color="#8B2F3F" />
                      <TextInput
                        style={styles.counterInput}
                        value={personsCount}
                        onChangeText={setPersonsCount}
                        keyboardType="number-pad"
                        editable={!isValidating}
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.counterButton}
                      onPress={incrementPersons}
                      disabled={isValidating}
                    >
                      <Ionicons name="add" size={24} color="#8B2F3F" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.hint}>Nombre de personnes concernées par la transaction</Text>
                </View>
              </View>

              {/* Note d'information */}
              <View style={styles.noteContainer}>
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <Text style={styles.noteText}>
                  Une réduction de {discountPercent ?? 10}% sera appliquée sur le montant total pour le client.
                </Text>
              </View>
            </ScrollView>

            {/* Boutons d'action */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={isValidating}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.validateButton, isValidating && styles.buttonDisabled]}
                onPress={handleValidate}
                disabled={isValidating}
              >
                {isValidating ? (
                  <>
                    <Text style={styles.validateButtonText}>Validation...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text style={styles.validateButtonText}>Valider</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-start',
  } as ViewStyle,
  safeArea: {
    top: responsiveSpacing(50),
    flex: 1,
  } as ViewStyle,
  modalContent: {
    flex: 1,
    backgroundColor: '#13070B',
    borderRadius: 0,
    ...Shadows.lg,
  } as ViewStyle,
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  } as ViewStyle,
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  } as ViewStyle,
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(139, 47, 63, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  modalTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.light,
    letterSpacing: -0.5,
  } as TextStyle,
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  } as ViewStyle,
  section: {
    marginBottom: Spacing.xl,
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  } as TextStyle,
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Shadows.sm,
  } as ViewStyle,
  storeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(139, 47, 63, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  storeName: {
    flex: 1,
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.light,
  } as TextStyle,
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  } as ViewStyle,
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  } as ViewStyle,
  infoTextContainer: {
    flex: 1,
  } as ViewStyle,
  infoLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginBottom: 2,
  } as TextStyle,
  infoValue: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.light,
    fontWeight: '600',
  } as TextStyle,
  formGroup: {
    marginBottom: Spacing.xl,
  } as ViewStyle,
  label: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.light,
    marginBottom: Spacing.sm,
    letterSpacing: -0.2,
  } as TextStyle,
  required: {
    color: '#EF4444',
    fontWeight: '700',
  } as TextStyle,
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 47, 63, 0.25)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    ...Shadows.sm,
  } as ViewStyle,
  inputIcon: {
    marginRight: Spacing.md,
    opacity: 0.8,
  } as TextStyle,
  input: {
    flex: 1,
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.light,
    paddingVertical: Spacing.sm,
    letterSpacing: -0.2,
  } as TextStyle,
  currency: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: '#8B2F3F',
    marginLeft: Spacing.sm,
    backgroundColor: 'rgba(139, 47, 63, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  } as TextStyle,
  hint: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
    marginTop: Spacing.xs,
    fontStyle: 'normal',
  } as TextStyle,
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    justifyContent: 'center',
  } as ViewStyle,
  counterButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(139, 47, 63, 0.18)',
    borderWidth: 1.5,
    borderColor: '#8B2F3F',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  } as ViewStyle,
  counterButtonDisabled: {
    opacity: 0.25,
    borderColor: Colors.text.muted,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  } as ViewStyle,
  counterValueContainer: {
    minWidth: 110,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 47, 63, 0.25)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  } as ViewStyle,
  counterInput: {
    minWidth: 40,
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.light,
    paddingVertical: 0,
    textAlign: 'center',
    letterSpacing: -0.2,
  } as TextStyle,
  calculationCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    ...Shadows.md,
  } as ViewStyle,
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  calculationLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  } as ViewStyle,
  calculationLabelText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    fontWeight: '600',
  } as TextStyle,
  calculationValue: {
    alignItems: 'flex-end',
  } as ViewStyle,
  discountPercent: {
    fontSize: Typography.sizes.lg,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: -0.5,
  } as TextStyle,
  discountAmount: {
    fontSize: Typography.sizes.sm,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 2,
  } as TextStyle,
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: Spacing.md,
  } as ViewStyle,
  amountNetValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    color: '#8B2F3F',
    letterSpacing: -0.5,
  } as TextStyle,
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  } as ViewStyle,
  noteText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.text.light,
    lineHeight: 20,
    letterSpacing: -0.1,
  } as TextStyle,
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  } as ViewStyle,
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  } as ViewStyle,
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  } as ViewStyle,
  cancelButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.light,
    letterSpacing: -0.2,
  } as TextStyle,
  validateButton: {
    backgroundColor: '#8B2F3F',
    borderWidth: 1,
    borderColor: 'rgba(139, 47, 63, 0.5)',
  } as ViewStyle,
  validateButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.2,
  } as TextStyle,
  buttonDisabled: {
    opacity: 0.5,
  } as ViewStyle,
});
