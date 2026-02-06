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
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setShowEditModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={20} color={Colors.text.light} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Nom complet */}
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="person" size={20} color={Colors.text.secondary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Nom complet</Text>
                  <Text style={styles.infoValue}>
                    {userInfo.firstName || ''} {userInfo.lastName || ''}
                  </Text>
                </View>
              </View>

              <View style={styles.separator} />

              {/* Email */}
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="mail" size={20} color={Colors.text.secondary} />
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

              {/* Téléphone */}
              {userInfo.phoneNumber && (
                <>
                  <View style={styles.separator} />
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="call" size={20} color={Colors.text.secondary} />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Téléphone</Text>
                      <Text style={styles.infoValue}>{userInfo.phoneNumber}</Text>
                    </View>
                  </View>
                </>
              )}

              {/* Date de naissance */}
              {userInfo.birthDate && (
                <>
                  <View style={styles.separator} />
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="calendar" size={20} color={Colors.text.secondary} />
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
                </>
              )}

              {/* Adresse */}
              {userInfo.address && (
                <>
                  <View style={styles.separator} />
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="location" size={20} color={Colors.text.secondary} />
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
                </>
              )}
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
  editButton: {
    padding: Spacing.xs,
  } as ViewStyle,
  content: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  } as ViewStyle,
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  } as ViewStyle,
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  infoContent: {
    flex: 1,
  } as ViewStyle,
  infoLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  } as TextStyle,
  infoValue: {
    fontSize: Typography.sizes.base,
    color: Colors.text.light,
    fontWeight: '600',
    lineHeight: 22,
  } as TextStyle,
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: Spacing.sm,
  } as ViewStyle,
});

