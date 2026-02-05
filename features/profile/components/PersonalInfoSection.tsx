import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';

interface PersonalInfoSectionProps {
  userInfo: any;
  onEditPress: () => void;
}

export const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
  userInfo,
  onEditPress,
}) => {
  if (!userInfo) return null;

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={onEditPress}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={16} color={Colors.text.light} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.infoRow}>
        <Ionicons name="person" size={20} color={Colors.text.secondary} />
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Nom complet</Text>
          <Text style={styles.infoValue}>
            {userInfo.firstName || ''} {userInfo.lastName || ''}
          </Text>
        </View>
      </View>

      <View style={styles.separator} />

      <View style={styles.infoRow}>
        <Ionicons name="mail" size={20} color={Colors.text.secondary} />
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

      {userInfo.birthDate && (
        <>
          <View style={styles.separator} />
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={20} color={Colors.text.secondary} />
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

      {userInfo.address && (
        <>
          <View style={styles.separator} />
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color={Colors.text.secondary} />
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

      {userInfo.phoneNumber && (
        <>
          <View style={styles.separator} />
          <View style={styles.infoRow}>
            <Ionicons name="call" size={20} color={Colors.text.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Téléphone</Text>
              <Text style={styles.infoValue}>{userInfo.phoneNumber}</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
        borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Shadows.md,
    maxWidth: '100%',
  } as ViewStyle,
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    color: Colors.text.light,
    letterSpacing: -0.3,
  } as TextStyle,
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(139, 47, 63, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 47, 63, 0.4)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  } as ViewStyle,
  editButtonText: {
    color: Colors.text.light,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  } as TextStyle,
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
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
    marginBottom: 2,
  } as TextStyle,
  infoValue: {
    fontSize: Typography.sizes.base,
    color: Colors.text.light,
    fontWeight: '600',
    lineHeight: 22,
  } as TextStyle,
  separator: {
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: Spacing.sm,
  } as ViewStyle,
});

