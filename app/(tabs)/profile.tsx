import { DebugUsersViewer } from '@/components/debug-users-viewer';
import { NavigationTransition } from '@/components/common/navigation-transition';
import { NeoCard } from '@/components/neo/NeoCard';
import { NeoChip } from '@/components/neo/NeoChip';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [faceId, setFaceId] = useState(true);
  const [showDebugUsers, setShowDebugUsers] = useState(false);
  const { signOut, user } = useAuth();

  const initials = useMemo(() => {
    const first = user?.firstName?.charAt(0);
    const last = user?.lastName?.charAt(0);
    if (first || last) {
      return `${first ?? ''}${last ?? ''}`.toUpperCase();
    }
    return user?.email?.charAt(0)?.toUpperCase() ?? 'U';
  }, [user?.firstName, user?.lastName, user?.email]);

  const displayName = useMemo(() => {
    const full = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    return full.length > 0 ? full : user?.email?.split('@')[0] ?? 'Utilisateur';
  }, [user?.firstName, user?.lastName, user?.email]);

  const roleLabel = useMemo(() => {
    const rawRole = (user as any)?.role ?? (user as any)?.Role;
    if (typeof rawRole === 'string' && rawRole.length > 0) {
      return rawRole;
    }
    if (user?.email?.toLowerCase().includes('partner')) {
      return 'Partner';
    }
    return 'Membre';
  }, [user]);

  const lastLoginLabel = useMemo(() => {
    if (user?.lastLoginAt) {
      try {
        return new Date(user.lastLoginAt).toLocaleString('fr-FR', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return user.lastLoginAt;
      }
    }
    return 'Jamais';
  }, [user?.lastLoginAt]);

  const accountStatusLabel = useMemo(() => {
    if (user?.status === undefined || user?.status === null) {
      return 'Actif';
    }
    return user.status === 0 ? 'Actif' : 'Inactif';
  }, [user?.status]);

  const cityLabel = useMemo(() => {
    const city = (user as any)?.address?.city;
    return city && city.length > 0 ? city : 'Non renseigné';
  }, [user]);

  const userIdShort = useMemo(() => {
    if (user?.id) {
      return `${user.id.slice(0, 6)}…`;
    }
    return '—';
  }, [user?.id]);

  const heroGradient = ['#4C0F22', '#1A112A'] as const;

  const handleLogout = async () => {
    await signOut();
    router.replace('/connexion/login');
  };

  return (
    <NavigationTransition>
      <View style={styles.screen}>
        <LinearGradient
          colors={['#450A1D', '#120A18']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <StatusBar barStyle="light-content" />
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <NeoCard gradient={heroGradient} style={styles.profileHero}>
              <View style={styles.heroHeader}>
                <View style={styles.heroIdentity}>
                  <View style={styles.heroAvatar}>
                    <Text style={styles.heroInitials}>{initials}</Text>
                  </View>
                  <View style={styles.heroInfo}>
                    <Text style={styles.heroName}>{displayName}</Text>
                    <Text style={styles.heroEmail}>{user?.email ?? '—'}</Text>
                    <View style={styles.heroMetaRow}>
                      <NeoChip label={roleLabel} tone="positive" />
                      <View style={styles.heroSeparatorDot} />
                      <Text style={styles.heroMetaText}>Dernière connexion {lastLoginLabel}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.heroActions}>
                  <TouchableOpacity style={styles.iconButton} onPress={() => console.log('Notifications')}>
                    <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton} onPress={() => console.log('Paramètres')}>
                    <Ionicons name="settings-outline" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.heroStatsRow}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>Statut</Text>
                  <Text style={styles.heroStatValue}>{accountStatusLabel}</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>Ville</Text>
                  <Text style={styles.heroStatValue}>{cityLabel}</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>ID</Text>
                  <Text style={styles.heroStatValue}>{userIdShort}</Text>
                </View>
              </View>
            </NeoCard>

            <NeoCard variant="glass" style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Abonnement</Text>
                  <Text style={styles.sectionSubtitle}>Gestion de votre offre partenaire</Text>
                </View>
                <TouchableOpacity style={styles.textButton} onPress={() => console.log('Gestion abonnement')}>
                  <Text style={styles.textButtonLabel}>Gérer</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.subscriptionRow}>
                <View>
                  <Text style={styles.subscriptionPlan}>Plan Partenaire</Text>
                  <Text style={styles.subscriptionMeta}>Renouvellement automatique</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.status.success} />
                  <Text style={styles.statusBadgeText}>Actif</Text>
                </View>
              </View>
            </NeoCard>

            <NeoCard variant="glass" style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Moyens de paiement</Text>
                <TouchableOpacity style={styles.textButton} onPress={() => console.log('Ajouter moyen de paiement')}>
                  <Text style={styles.textButtonLabel}>Ajouter</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.paymentList}>
                <TouchableOpacity style={styles.paymentItem} activeOpacity={0.8}>
                  <View style={styles.menuIconBadge}>
                    <Ionicons name="card" size={18} color={Colors.accent.cyan} />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentTitle}>Visa •••• 4242</Text>
                    <Text style={styles.paymentSubtitle}>Expire 08/26</Text>
                    <View style={styles.inlineRow}>
                      <View style={styles.defaultChip}>
                        <Text style={styles.defaultChipText}>Par défaut</Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.paymentItem} activeOpacity={0.8}>
                  <View style={styles.menuIconBadge}>
                    <Ionicons name="logo-paypal" size={18} color={Colors.accent.rose} />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentTitle}>PayPal</Text>
                    <Text style={styles.paymentSubtitle}>Connecté</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
                </TouchableOpacity>
              </View>
            </NeoCard>

            <NeoCard variant="glass" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Préférences</Text>
              <View style={styles.settingsList}>
                <View style={styles.settingRow}>
                  <View style={styles.settingCopy}>
                    <Text style={styles.settingTitle}>Notifications push</Text>
                    <Text style={styles.settingSubtitle}>Offres et alertes personnalisées</Text>
                  </View>
                  <Switch
                    value={pushEnabled}
                    onValueChange={setPushEnabled}
                    trackColor={{ false: 'rgba(255,255,255,0.2)', true: Colors.accent.rose }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="rgba(255,255,255,0.2)"
                  />
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.settingCopy}>
                    <Text style={styles.settingTitle}>Interface sombre</Text>
                    <Text style={styles.settingSubtitle}>Synchroniser avec l’appareil</Text>
                  </View>
                  <Switch
                    value={darkMode}
                    onValueChange={setDarkMode}
                    trackColor={{ false: 'rgba(255,255,255,0.2)', true: Colors.secondary[500] }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="rgba(255,255,255,0.2)"
                  />
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.settingCopy}>
                    <Text style={styles.settingTitle}>Face ID</Text>
                    <Text style={styles.settingSubtitle}>Connexion biométrique</Text>
                  </View>
                  <Switch
                    value={faceId}
                    onValueChange={setFaceId}
                    trackColor={{ false: 'rgba(255,255,255,0.2)', true: Colors.accent.cyan }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="rgba(255,255,255,0.2)"
                  />
                </View>
              </View>
            </NeoCard>

            <NeoCard variant="glass" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Raccourcis</Text>
              <View style={styles.menuList}>
                <TouchableOpacity style={styles.menuItem} activeOpacity={0.75}>
                  <View style={styles.menuIconBadge}>
                    <Ionicons name="wallet-outline" size={18} color={Colors.accent.cyan} />
                  </View>
                  <Text style={styles.menuText}>Moyens de paiement</Text>
                  <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} activeOpacity={0.75}>
                  <View style={styles.menuIconBadge}>
                    <Ionicons name="download-outline" size={18} color={Colors.accent.gold} />
                  </View>
                  <Text style={styles.menuText}>Factures et reçus</Text>
                  <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} activeOpacity={0.75}>
                  <View style={styles.menuIconBadge}>
                    <Ionicons name="help-circle-outline" size={18} color={Colors.accent.rose} />
                  </View>
                  <Text style={styles.menuText}>Aide et support</Text>
                  <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, styles.menuItemAccent]}
                  activeOpacity={0.75}
                  onPress={() => setShowDebugUsers(true)}
                >
                  <View style={[styles.menuIconBadge, styles.menuIconAccent]}>
                    <Ionicons name="bug-outline" size={18} color={Colors.accent.cyan} />
                  </View>
                  <Text style={[styles.menuText, styles.menuTextAccent]}>Voir les utilisateurs (debug)</Text>
                  <Ionicons name="chevron-forward" size={18} color={Colors.accent.cyan} />
                </TouchableOpacity>
              </View>
            </NeoCard>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
              <Ionicons name="log-out" size={20} color={Colors.status.error} />
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>

        <DebugUsersViewer visible={showDebugUsers} onClose={() => setShowDebugUsers(false)} />
      </View>
    </NavigationTransition>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background.dark,
  } as ViewStyle,
  safeArea: {
    flex: 1,
  } as ViewStyle,
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['4xl'],
    gap: Spacing['2xl'],
  } as ViewStyle,
  profileHero: {
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
    gap: Spacing['2xl'],
  } as ViewStyle,
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.lg,
  } as ViewStyle,
  heroIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  } as ViewStyle,
  heroAvatar: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  heroInitials: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.light,
  } as TextStyle,
  heroInfo: {
    flex: 1,
    gap: Spacing.xs,
  } as ViewStyle,
  heroName: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
  heroEmail: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  } as ViewStyle,
  heroSeparatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  } as ViewStyle,
  heroMetaText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  } as TextStyle,
  heroActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  } as ViewStyle,
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  } as ViewStyle,
  heroStat: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs / 2,
  } as ViewStyle,
  heroStatLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  } as TextStyle,
  heroStatValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
  heroDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.12)',
  } as ViewStyle,
  sectionCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
  } as ViewStyle,
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
  sectionSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.muted,
    marginTop: Spacing.xs / 2,
  } as TextStyle,
  textButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  } as ViewStyle,
  textButtonLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.light,
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  subscriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  subscriptionPlan: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
  subscriptionMeta: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs / 2,
  } as TextStyle,
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(39,239,161,0.16)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(39,239,161,0.35)',
  } as ViewStyle,
  statusBadgeText: {
    fontSize: Typography.sizes.sm,
    color: Colors.status.success,
    fontWeight: Typography.weights.semibold as any,
  } as TextStyle,
  paymentList: {
    gap: Spacing.sm,
  } as ViewStyle,
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  } as ViewStyle,
  menuIconBadge: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  paymentInfo: {
    flex: 1,
    gap: 4,
  } as ViewStyle,
  paymentTitle: {
    fontSize: Typography.sizes.base,
    color: Colors.text.light,
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  paymentSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  } as ViewStyle,
  defaultChip: {
    backgroundColor: 'rgba(61,188,255,0.16)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 1.2,
  } as ViewStyle,
  defaultChipText: {
    fontSize: Typography.sizes.xs,
    color: Colors.accent.cyan,
    fontWeight: Typography.weights.semibold as any,
  } as TextStyle,
  settingsList: {
    gap: Spacing.md,
  } as ViewStyle,
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  } as ViewStyle,
  settingCopy: {
    flex: 1,
    marginRight: Spacing.md,
    gap: 4,
  } as ViewStyle,
  settingTitle: {
    fontSize: Typography.sizes.base,
    color: Colors.text.light,
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  settingSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.muted,
  } as TextStyle,
  menuList: {
    gap: Spacing.sm,
  } as ViewStyle,
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  } as ViewStyle,
  menuIconAccent: {
    backgroundColor: 'rgba(39,239,161,0.16)',
    borderColor: 'rgba(39,239,161,0.35)',
  } as ViewStyle,
  menuText: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.text.light,
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  menuItemAccent: {
    borderColor: 'rgba(39,239,161,0.35)',
    backgroundColor: 'rgba(39,239,161,0.12)',
  } as ViewStyle,
  menuTextAccent: {
    color: Colors.accent.cyan,
  } as TextStyle,
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing['3xl'],
    backgroundColor: 'rgba(255,107,107,0.12)',
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.35)',
    paddingVertical: Spacing.md,
  } as ViewStyle,
  logoutText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.status.error,
  } as TextStyle,
});
