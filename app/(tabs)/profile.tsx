import { DebugUsersViewer } from '@/components/debug-users-viewer';
import { NavigationTransition } from '@/components/common/navigation-transition';
import { ProfileHeader } from '@/components/headers/profile-header';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';

export default function ProfileScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [faceId, setFaceId] = useState(true);
  const [showDebugUsers, setShowDebugUsers] = useState(false);
  const { signOut, user } = useAuth();
  const handlePartnerMode = () => {
    console.log('Mode partenaire');
  };
  const handleLogout = async () => {
    await signOut();
    router.replace('/connexion/login');
  };

  return (
    <NavigationTransition>
      <View style={styles.container}>
        <ProfileHeader
          title="Mon Profil"
          subtitle="Gérez votre compte"
          userEmail={user?.email}
          onSettingsPress={() => console.log('Settings')}
          onNotificationPress={() => console.log('Notifications')}
        />

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: Spacing['2xl'] }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Carte Profil */}
          <View style={styles.profileCard}>
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarInitials}>
                {user ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={{ flex: 1 } as ViewStyle}>
              <Text style={styles.userName}>
                {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilisateur' : 'Utilisateur'}
              </Text>
              <Text style={styles.userEmail}>{user?.email || 'Non connecté'}</Text>
              <View style={styles.userMetaRow}>
                <View style={styles.familyChip}>
                  <Text style={styles.familyChipText}>Famille</Text>
                </View>
                <Text style={styles.userMetaText}>Expire le 10/02/2025</Text>
              </View>
            </View>
          </View>

          {/* Abonnement */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Abonnement</Text>
              <TouchableOpacity style={styles.ghostButton}>
                <Text style={styles.ghostButtonText}>Modifier</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.planRow}>
              <View style={{ flex: 1 } as ViewStyle}>
                <Text style={styles.planName}>Plan Famille</Text>
                <Text style={styles.planDetails}>7€/mois • Renouvelé automatiquement</Text>
              </View>
              <View style={styles.statusChipActive}>
                <Text style={styles.statusChipText}>Actif</Text>
              </View>
            </View>
            <TouchableOpacity>
              <Text style={styles.cancelLink}>Résilier l’abonnement</Text>
            </TouchableOpacity>
          </View>

          {/* Moyens de paiement */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Moyens de paiement</Text>
            <TouchableOpacity style={styles.paymentItem}>
              <Ionicons name="card" size={18} color={Colors.text.primary} />
              <View style={{ flex: 1, marginLeft: Spacing.md } as ViewStyle}>
                <Text style={styles.paymentTitle}>Visa •••• 4242</Text>
                <View style={styles.inlineRow}>
                  <View style={styles.defaultChip}><Text style={styles.defaultChipText}>Par défaut</Text></View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.paymentItem}>
              <Ionicons name="logo-paypal" size={18} color={Colors.text.primary} />
              <View style={{ flex: 1, marginLeft: Spacing.md } as ViewStyle}>
                <Text style={styles.paymentTitle}>PayPal</Text>
                <Text style={styles.paymentSubtitle}>sarah.martinez@email.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
            </TouchableOpacity>
          </View>

          {/* Paramètres */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Paramètres</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingTitle}>Notifications push</Text>
                <Text style={styles.settingSubtitle}>Offres et alertes</Text>
              </View>
              <Switch value={pushEnabled} onValueChange={setPushEnabled} />
            </View>

            <View style={styles.separator} />

            <View style={styles.settingRow}>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingTitle}>Mode sombre</Text>
                <Text style={styles.settingSubtitle}>Interface sombre</Text>
              </View>
              <Switch value={darkMode} onValueChange={setDarkMode} />
            </View>

            <View style={styles.separator} />

            <View style={styles.settingRow}>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingTitle}>Face ID</Text>
                <Text style={styles.settingSubtitle}>Connexion biométrique</Text>
              </View>
              <Switch value={faceId} onValueChange={setFaceId} />
            </View>
          </View>

          {/* Liens rapides */}
          <View style={styles.menuSection}>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="wallet-outline" size={22} color={Colors.text.primary} />
              <Text style={styles.menuText}>Moyens de paiement</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="download-outline" size={22} color={Colors.text.primary} />
              <Text style={styles.menuText}>Factures et reçus</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="notifications-outline" size={22} color={Colors.text.primary} />
              <Text style={styles.menuText}>Notifications</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="shield-checkmark-outline" size={22} color={Colors.text.primary} />
              <Text style={styles.menuText}>Sécurité</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="help-circle-outline" size={22} color={Colors.text.primary} />
              <Text style={styles.menuText}>Aide et support</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
            </TouchableOpacity>

            {/* Bouton Debug pour voir tous les utilisateurs */}
            <TouchableOpacity 
              style={[styles.menuItem, { backgroundColor: '#F5F3FF', borderBottomWidth: 0 }]} 
              onPress={() => setShowDebugUsers(true)}
            >
              <Ionicons name="bug-outline" size={22} color="#8B5CF6" />
              <Text style={[styles.menuText, { color: '#8B5CF6' }]}>
                👤 Voir tous les utilisateurs (Debug)
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#8B5CF6" />
            </TouchableOpacity>
          </View>

          {/* Déconnexion */}
          <View style={styles.logoutContainer}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} >
              <Ionicons name="log-out" size={20} color="#EF4444" />
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Modal de debug des utilisateurs */}
        <DebugUsersViewer 
          visible={showDebugUsers} 
          onClose={() => setShowDebugUsers(false)} 
        />
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
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  } as ViewStyle,
  avatarBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  avatarInitials: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: Colors.secondary[600],
  } as TextStyle,
  userName: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: 'bold' as any,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  } as TextStyle,
  userEmail: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  } as TextStyle,
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  } as ViewStyle,
  familyChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
  } as ViewStyle,
  familyChipText: {
    color: Colors.secondary[600],
    fontWeight: '600',
  } as TextStyle,
  userMetaText: {
    color: Colors.text.secondary,
  } as TextStyle,
  sectionCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  } as ViewStyle,
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
  } as TextStyle,
  ghostButton: {
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  } as ViewStyle,
  ghostButtonText: {
    color: Colors.text.primary,
    fontWeight: '600',
  } as TextStyle,
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  } as ViewStyle,
  planName: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  } as TextStyle,
  planDetails: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    marginTop: 2,
  } as TextStyle,
  statusChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
  } as ViewStyle,
  statusChipText: {
    color: Colors.status.success,
    fontWeight: '600',
  } as TextStyle,
  cancelLink: {
    color: '#ef4444',
    fontWeight: '600',
    marginTop: Spacing.sm,
  } as TextStyle,
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.primary[100],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
  } as ViewStyle,
  paymentTitle: {
    fontSize: Typography.sizes.lg,
    color: Colors.text.primary,
  } as TextStyle,
  paymentSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  } as ViewStyle,
  defaultChip: {
    backgroundColor: Colors.primary[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  } as ViewStyle,
  defaultChipText: {
    fontSize: Typography.sizes.xs,
    color: Colors.primary[700],
    fontWeight: '600',
  } as TextStyle,
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  } as ViewStyle,
  settingTextCol: {
    flex: 1,
  } as ViewStyle,
  settingTitle: {
    fontSize: Typography.sizes.lg,
    color: Colors.text.primary,
    marginBottom: 2,
  } as TextStyle,
  settingSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  separator: {
    height: 1,
    backgroundColor: Colors.primary[100],
  } as ViewStyle,
  menuSection: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.sm,
    ...Shadows.sm,
  } as ViewStyle,
  logoutContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  } as ViewStyle,
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    ...Shadows.sm,
  } as ViewStyle,
  logoutText: {
    marginLeft: Spacing.sm,
    color: '#EF4444',
    fontWeight: '600',
  } as TextStyle,
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