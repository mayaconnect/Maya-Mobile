import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

interface PartnerAccountManagementProps {
  onManageBusiness?: () => void;
  onPartnerSupport?: () => void;
  onLogout?: () => void;
}

export const PartnerAccountManagement: React.FC<PartnerAccountManagementProps> = ({
  onManageBusiness,
  onPartnerSupport,
  onLogout,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Gestion du compte</Text>

      {/* Gérer les informations business */}
      <TouchableOpacity
        style={styles.managementItem}
        onPress={onManageBusiness}
        activeOpacity={0.7}
      >
        <Ionicons name="business-outline" size={20} color={Colors.text.light} />
        <Text style={styles.managementText}>Gérer les informations business</Text>
        <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
      </TouchableOpacity>

      {/* Support partenaire */}
      <TouchableOpacity
        style={styles.managementItem}
        onPress={onPartnerSupport}
        activeOpacity={0.7}
      >
        <Ionicons name="people-outline" size={20} color={Colors.text.light} />
        <Text style={styles.managementText}>Support partenaire</Text>
        <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
      </TouchableOpacity>

      {/* Se déconnecter */}
      <TouchableOpacity
        style={[styles.managementItem, styles.logoutItem]}
        onPress={onLogout}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={[styles.managementText, styles.logoutText]}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '900',
    color: Colors.text.light,
    marginBottom: Spacing.lg,
    letterSpacing: -0.3,
  } as TextStyle,
  managementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    gap: Spacing.sm,
  } as ViewStyle,
  managementText: {
    flex: 1,
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.light,
  } as TextStyle,
  logoutItem: {
    borderBottomWidth: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(239, 68, 68, 0.3)',
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
  } as ViewStyle,
  logoutText: {
    color: '#EF4444',
  } as TextStyle,
});

