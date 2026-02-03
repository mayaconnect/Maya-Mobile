import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { updateCurrentUser as updateCurrentUserApi } from '@/services/auth/auth.profile';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userInfo: any;
  onUpdate: (updatedUser: any) => void;
}

interface EditForm {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  userInfo,
  onUpdate,
}) => {
  const insets = useSafeAreaInsets();
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    firstName: userInfo?.firstName || '',
    lastName: userInfo?.lastName || '',
    street: userInfo?.address?.street || '',
    city: userInfo?.address?.city || '',
    state: userInfo?.address?.state || '',
    postalCode: userInfo?.address?.postalCode || '',
    country: userInfo?.address?.country || '',
  });

  // Réinitialiser le formulaire quand la modal s'ouvre
  React.useEffect(() => {
    if (visible && userInfo) {
      setEditForm({
        firstName: userInfo.firstName || '',
        lastName: userInfo.lastName || '',
        street: userInfo.address?.street || '',
        city: userInfo.address?.city || '',
        state: userInfo.address?.state || '',
        postalCode: userInfo.address?.postalCode || '',
        country: userInfo.address?.country || '',
      });
    }
  }, [visible, userInfo]);

  const handleSave = async () => {
    setEditingProfile(true);
    try {
      console.log('💾 [EditProfileModal] Sauvegarde des informations personnelles...');
      
      const updates: any = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        address: {
          street: editForm.street,
          city: editForm.city,
          state: editForm.state,
          postalCode: editForm.postalCode,
          country: editForm.country,
        },
      };

      const updatedUser = await updateCurrentUserApi(updates);
      
      onUpdate(updatedUser);
      
      console.log('✅ [EditProfileModal] Informations personnelles mises à jour');
      Alert.alert('Succès', 'Vos informations ont été mises à jour');
      onClose();
    } catch (error) {
      console.error('❌ [EditProfileModal] Erreur lors de la mise à jour:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setEditingProfile(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <LinearGradient
          colors={Colors.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, Spacing.xl) }]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalTitleContainer}>
                <View style={styles.modalIconContainer}>
                  <Ionicons name="create-outline" size={24} color={Colors.primary[400]} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Modifier mes informations</Text>
                  <Text style={styles.modalSubtitle}>
                    Mettez à jour vos informations personnelles
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={onClose}
                style={styles.modalCloseButton}
                disabled={editingProfile}
              >
                <Ionicons name="close" size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView 
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Section Informations personnelles */}
            <BlurView intensity={15} tint="dark" style={styles.formSection}>
              <View style={styles.formSectionHeader}>
                <Ionicons name="person" size={20} color={Colors.primary[400]} />
                <Text style={styles.formSectionTitle}>Informations personnelles</Text>
              </View>
              
              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <View style={styles.formLabelContainer}>
                    <Ionicons name="person-outline" size={16} color={Colors.text.secondary} />
                    <Text style={styles.formLabel}>Prénom</Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.firstName}
                    onChangeText={(text) => setEditForm({ ...editForm, firstName: text })}
                    placeholder="Votre prénom"
                    placeholderTextColor={Colors.text.muted}
                    editable={!editingProfile}
                  />
                </View>

                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <View style={styles.formLabelContainer}>
                    <Ionicons name="person-outline" size={16} color={Colors.text.secondary} />
                    <Text style={styles.formLabel}>Nom</Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.lastName}
                    onChangeText={(text) => setEditForm({ ...editForm, lastName: text })}
                    placeholder="Votre nom"
                    placeholderTextColor={Colors.text.muted}
                    editable={!editingProfile}
                  />
                </View>
              </View>
            </BlurView>

            {/* Section Adresse */}
            <BlurView intensity={15} tint="dark" style={styles.formSection}>
              <View style={styles.formSectionHeader}>
                <Ionicons name="location" size={20} color={Colors.primary[400]} />
                <Text style={styles.formSectionTitle}>Adresse</Text>
              </View>
              
              <View style={styles.formGroup}>
                <View style={styles.formLabelContainer}>
                  <Ionicons name="location-outline" size={16} color={Colors.text.secondary} />
                  <Text style={styles.formLabel}>Rue</Text>
                </View>
                <TextInput
                  style={styles.formInput}
                  value={editForm.street}
                  onChangeText={(text) => setEditForm({ ...editForm, street: text })}
                  placeholder="Numéro et nom de rue"
                  placeholderTextColor={Colors.text.muted}
                  editable={!editingProfile}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <View style={styles.formLabelContainer}>
                    <Ionicons name="business-outline" size={16} color={Colors.text.secondary} />
                    <Text style={styles.formLabel}>Ville</Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.city}
                    onChangeText={(text) => setEditForm({ ...editForm, city: text })}
                    placeholder="Ville"
                    placeholderTextColor={Colors.text.muted}
                    editable={!editingProfile}
                  />
                </View>

                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <View style={styles.formLabelContainer}>
                    <Ionicons name="map-outline" size={16} color={Colors.text.secondary} />
                    <Text style={styles.formLabel}>Code postal</Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.postalCode}
                    onChangeText={(text) => setEditForm({ ...editForm, postalCode: text })}
                    placeholder="Code postal"
                    placeholderTextColor={Colors.text.muted}
                    keyboardType="numeric"
                    editable={!editingProfile}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <View style={styles.formLabelContainer}>
                  <Ionicons name="globe-outline" size={16} color={Colors.text.secondary} />
                  <Text style={styles.formLabel}>Région / État</Text>
                </View>
                <TextInput
                  style={styles.formInput}
                  value={editForm.state}
                  onChangeText={(text) => setEditForm({ ...editForm, state: text })}
                  placeholder="Région ou État"
                  placeholderTextColor={Colors.text.muted}
                  editable={!editingProfile}
                />
              </View>

              <View style={styles.formGroup}>
                <View style={styles.formLabelContainer}>
                  <Ionicons name="flag-outline" size={16} color={Colors.text.secondary} />
                  <Text style={styles.formLabel}>Pays</Text>
                </View>
                <TextInput
                  style={styles.formInput}
                  value={editForm.country}
                  onChangeText={(text) => setEditForm({ ...editForm, country: text })}
                  placeholder="Pays"
                  placeholderTextColor={Colors.text.muted}
                  editable={!editingProfile}
                />
              </View>
            </BlurView>
          </ScrollView>

          {/* Footer avec boutons */}
          <BlurView intensity={15} tint="dark" style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={onClose}
              disabled={editingProfile}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color={Colors.text.light} />
              <Text style={styles.modalButtonCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSave]}
              onPress={handleSave}
              disabled={editingProfile}
              activeOpacity={0.8}
            >
              {editingProfile ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="white" />
                  <Text style={styles.modalButtonSaveText}>Enregistrer</Text>
                </>
              )}
            </TouchableOpacity>
          </BlurView>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  } as ViewStyle,
  modalContent: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    overflow: 'hidden',
  } as ViewStyle,
  modalHeader: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  } as ViewStyle,
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    flex: 1,
  } as ViewStyle,
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(139, 47, 63, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 47, 63, 0.4)',
  } as ViewStyle,
  modalTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    color: Colors.text.light,
    letterSpacing: -0.3,
    marginBottom: 4,
  } as TextStyle,
  modalSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '500',
  } as TextStyle,
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  } as ViewStyle,
  modalScrollView: {
    flex: 1,
  } as ViewStyle,
  modalScrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  } as ViewStyle,
  formSection: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  } as ViewStyle,
  formSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  } as ViewStyle,
  formSectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '800',
    color: Colors.text.light,
    letterSpacing: -0.3,
  } as TextStyle,
  formRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  } as ViewStyle,
  formGroup: {
    marginBottom: Spacing.lg,
  } as ViewStyle,
  formGroupHalf: {
    flex: 1,
  } as ViewStyle,
  formLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  } as ViewStyle,
  formLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  formInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.sizes.base,
    color: Colors.text.light,
    fontWeight: '600',
  } as TextStyle,
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  } as ViewStyle,
  modalButtonCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  } as ViewStyle,
  modalButtonSave: {
    backgroundColor: Colors.primary[600],
    borderWidth: 1,
    borderColor: 'rgba(139, 47, 63, 0.5)',
    ...Shadows.md,
  } as ViewStyle,
  modalButtonCancelText: {
    color: Colors.text.light,
    fontSize: Typography.sizes.base,
    fontWeight: '700',
  } as TextStyle,
  modalButtonSaveText: {
    color: 'white',
    fontSize: Typography.sizes.base,
    fontWeight: '700',
  } as TextStyle,
});

