import { NavigationTransition } from '@/components/navigation-transition';
import { SharedHeader } from '@/components/shared-header';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';

export default function ProfileScreen() {
  const handlePartnerMode = () => {
    console.log('Mode partenaire');
  };

  return (
    <NavigationTransition>
      <View style={styles.container}>
        <SharedHeader
          title="Profil"
          subtitle="Gérez votre compte"
          onPartnerModePress={handlePartnerMode}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={40} color={Colors.primary[600]} />
              </View>
              <Text style={styles.userName}>Utilisateur Maya</Text>
              <Text style={styles.userEmail}>user@maya.com</Text>
            </View>

            <View style={styles.menuSection}>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="person-outline" size={24} color={Colors.text.primary} />
                <Text style={styles.menuText}>Informations personnelles</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="notifications-outline" size={24} color={Colors.text.primary} />
                <Text style={styles.menuText}>Notifications</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="settings-outline" size={24} color={Colors.text.primary} />
                <Text style={styles.menuText}>Paramètres</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="help-circle-outline" size={24} color={Colors.text.primary} />
                <Text style={styles.menuText}>Aide</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
              </TouchableOpacity>
            </View>
        </ScrollView>
      </View>
    </NavigationTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.light,
  } as ViewStyle,
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  } as ViewStyle,
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: 'bold' as any,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  } as TextStyle,
  subtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
  } as TextStyle,
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.background.light,
  } as ViewStyle,
  profileCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.md,
  } as ViewStyle,
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  } as ViewStyle,
  userName: {
    fontSize: Typography.sizes.xl,
    fontWeight: 'bold' as any,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  } as TextStyle,
  userEmail: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
  } as TextStyle,
  menuSection: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.sm,
    ...Shadows.sm,
  } as ViewStyle,
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary[50],
  } as ViewStyle,
  menuText: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.text.primary,
    marginLeft: Spacing.md,
  } as TextStyle,
});