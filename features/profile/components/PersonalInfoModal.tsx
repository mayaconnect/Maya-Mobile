import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EditProfileModal } from './EditProfileModal';

interface PersonalInfoModalProps {
  visible: boolean;
  onClose: () => void;
  userInfo: any;
  onUpdate: (updatedUser: any) => void;
}

export const PersonalInfoModal: React.FC<PersonalInfoModalProps> = ({
  visible,
  onClose,
  userInfo,
  onUpdate,
}) => {
  const [showEditModal, setShowEditModal] = React.useState(false);

  if (!userInfo) return null;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={Colors.text.light} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Informations personnelles</Text>
              <View style={styles.headerSpacer} />
            </View>

            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Nom complet */}
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="person" size={22} color="#8B2F3F" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Nom complet</Text>
                    <Text style={styles.infoValue}>
                      {userInfo.firstName || ''} {userInfo.lastName || ''}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Email */}
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="mail" size={22} color="#8B2F3F" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text 
                      style={styles.infoValue}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {userInfo.email || 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Téléphone */}
              {userInfo.phoneNumber && (
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="call" size={22} color="#8B2F3F" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Téléphone</Text>
                      <Text style={styles.infoValue}>{userInfo.phoneNumber}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Date de naissance */}
              {userInfo.birthDate && (
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="calendar" size={22} color="#8B2F3F" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Date de naissance</Text>
                      <Text style={styles.infoValue}>
                        {new Date(userInfo.birthDate).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Adresse */}
              {userInfo.address && (
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="location" size={22} color="#8B2F3F" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Adresse</Text>
                      <Text style={styles.infoValue}>
                        {userInfo.address.street && `${userInfo.address.street}\n`}
                        {[userInfo.address.postalCode, userInfo.address.city]
                          .filter(Boolean)
                          .join(' ')}
                        {userInfo.address.country && `\n${userInfo.address.country}`}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Bouton Modifier en bas */}
              <TouchableOpacity
                style={styles.editButtonLarge}
                onPress={() => setShowEditModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={20} color={Colors.text.light} />
                <Text style={styles.editButtonText}>Modifier les informations</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Modal d'édition */}
      <EditProfileModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        userInfo={userInfo}
        onUpdate={(updatedUser: any) => {
          onUpdate(updatedUser);
          setShowEditModal(false);
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#1A0A0E',
  } as ViewStyle,
  safeArea: {
    flex: 1,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  closeButton: {
    padding: Spacing.xs,
  } as ViewStyle,
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '900',
    color: Colors.text.light,
    letterSpacing: -0.5,
  } as TextStyle,
  headerSpacer: {
    width: 40,
  } as ViewStyle,
  content: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  } as ViewStyle,
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    ...Shadows.sm,
  } as ViewStyle,
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  } as ViewStyle,
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(139, 47, 63, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  infoContent: {
    flex: 1,
    paddingTop: 2,
  } as ViewStyle,
  infoLabel: {
    fontSize: Typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  } as TextStyle,
  infoValue: {
    fontSize: Typography.sizes.base,
    color: Colors.text.light,
    fontWeight: '600',
    lineHeight: 24,
  } as TextStyle,
  editButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B2F3F',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
    ...Shadows.md,
  } as ViewStyle,
  editButtonText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.light,
    fontWeight: '700',
    letterSpacing: 0.3,
  } as TextStyle,
});

