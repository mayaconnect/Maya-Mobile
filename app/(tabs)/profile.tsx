import { NavigationTransition } from '@/components/common/navigation-transition';
import { DebugUsersViewer } from '@/components/debug-users-viewer';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import { AuthService } from '@/services/auth.service';
import { ClientService } from '@/services/client.service';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [faceId, setFaceId] = useState(true);
  const [showDebugUsers, setShowDebugUsers] = useState(false);
  const { signOut, user, refreshUser } = useAuth();
  
  // États pour les informations complètes
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  // Charger les informations complètes de l'utilisateur
  useEffect(() => {
    const loadUserInfo = async () => {
      console.log('👤 [Profile] Chargement des informations utilisateur...');
      setLoading(true);
      try {
        // Récupérer les infos complètes depuis l'API
        const info = await AuthService.getCurrentUserInfo();
        console.log('✅ [Profile] Informations utilisateur récupérées:', {
          email: info.email,
          firstName: info.firstName,
          lastName: info.lastName,
          hasAddress: !!info.address,
          hasBirthDate: !!info.birthDate,
        });
        setUserInfo(info);

        // Récupérer l'abonnement si c'est un client
        setSubscriptionLoading(true);
        try {
          const hasSub = await ClientService.hasActiveSubscription();
          setHasSubscription(hasSub);
          console.log('📦 [Profile] Abonnement actif:', hasSub);

          if (hasSub) {
            const sub = await ClientService.getMySubscription();
            console.log('✅ [Profile] Détails de l\'abonnement récupérés:', sub);
            setSubscription(sub);
          }
        } catch (error) {
          console.warn('⚠️ [Profile] Impossible de récupérer l\'abonnement:', error);
        } finally {
          setSubscriptionLoading(false);
        }
      } catch (error) {
        console.error('❌ [Profile] Erreur lors du chargement des informations:', error);
        // Utiliser les données de base si l'API échoue
        if (user) {
          setUserInfo(user);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserInfo();
  }, [user]);

  const handlePartnerMode = () => {
    console.log('Mode partenaire');
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/connexion/login');
  };

  const handleRefresh = async () => {
    console.log('🔄 [Profile] Actualisation des informations...');
    setLoading(true);
    try {
      await refreshUser();
      const info = await AuthService.getCurrentUserInfo();
      setUserInfo(info);
      console.log('✅ [Profile] Informations actualisées');
    } catch (error) {
      console.error('❌ [Profile] Erreur lors de l\'actualisation:', error);
      Alert.alert('Erreur', 'Impossible d\'actualiser les informations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <NavigationTransition>
      <LinearGradient
        colors={Colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.title}>Mon Profil</Text>
            <Text style={styles.subtitle}>Gérez votre compte</Text>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={Colors.primary[600]} />
            }
          >
          {loading && !userInfo ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary[600]} />
              <Text style={styles.loadingText}>Chargement de votre profil...</Text>
            </View>
          ) : (
            <>
              {/* Carte Profil */}
              <View style={styles.profileCard}>
                <View style={styles.avatarBadge}>
                  {userInfo?.avatarBase64 ? (
                    <Image 
                      source={{ uri: `data:image/jpeg;base64,${userInfo.avatarBase64}` }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarInitials}>
                      {userInfo ? `${userInfo.firstName?.charAt(0) || ''}${userInfo.lastName?.charAt(0) || ''}`.toUpperCase() : 'U'}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 } as ViewStyle}>
                  <View style={styles.userNameRow}>
                    <Text style={styles.userName}>
                      {userInfo ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || 'Utilisateur' : 'Utilisateur'}
                    </Text>
                    <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                      <Ionicons name="refresh" size={18} color={Colors.primary[600]} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.userEmail}>{userInfo?.email || user?.email || 'Non connecté'}</Text>
                  
                  {userInfo?.birthDate && (
                    <View style={styles.userInfoRow}>
                      <Ionicons name="calendar" size={14} color={Colors.text.secondary} />
                      <Text style={styles.userInfoText}>
                        Né(e) le {new Date(userInfo.birthDate).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                  )}

                  {userInfo?.address && (
                    <View style={styles.userInfoRow}>
                      <Ionicons name="location" size={14} color={Colors.text.secondary} />
                      <Text style={styles.userInfoText} numberOfLines={1}>
                        {[
                          userInfo.address.street,
                          userInfo.address.postalCode,
                          userInfo.address.city
                        ].filter(Boolean).join(', ')}
                      </Text>
                    </View>
                  )}

                  {hasSubscription && (
                    <View style={styles.userMetaRow}>
                      <View style={styles.familyChip}>
                        <Ionicons name="checkmark-circle" size={14} color={Colors.status.success} />
                        <Text style={styles.familyChipText}>Abonnement actif</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Informations personnelles */}
              {userInfo && (
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Informations personnelles</Text>
                  
                  <View style={styles.infoRow}>
                    <Ionicons name="person" size={20} color={Colors.text.secondary} />
                    <View>
                      <Text style={styles.infoLabel}>Nom complet</Text>
                      <Text style={styles.infoValue}>
                        {userInfo.firstName || ''} {userInfo.lastName || ''}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.separator} />

                  <View style={styles.infoRow}>
                    <Ionicons name="mail" size={20} color={Colors.text.secondary} />
                    <View>
                      <Text style={styles.infoLabel}>Email</Text>
                      <Text style={styles.infoValue}>{userInfo.email || 'N/A'}</Text>
                    </View>
                  </View>

                  {userInfo.birthDate && (
                    <>
                      <View style={styles.separator} />
                      <View style={styles.infoRow}>
                        <Ionicons name="calendar" size={20} color={Colors.text.secondary} />
                        <View>
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
                        <View>
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
                        <View>
                          <Text style={styles.infoLabel}>Téléphone</Text>
                          <Text style={styles.infoValue}>{userInfo.phoneNumber}</Text>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              )}

              {/* Abonnement */}
              {subscriptionLoading ? (
                <View style={styles.sectionCard}>
                  <View style={styles.loadingSection}>
                    <ActivityIndicator size="small" color={Colors.primary[600]} />
                    <Text style={styles.loadingSectionText}>Vérification de l'abonnement...</Text>
                  </View>
                </View>
              ) : hasSubscription && subscription ? (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Abonnement</Text>
                    <TouchableOpacity style={styles.ghostButton}>
                      <Text style={styles.ghostButtonText}>Modifier</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.planRow}>
                    <View style={{ flex: 1 } as ViewStyle}>
                      <Text style={styles.planName}>
                        {subscription.planName || subscription.plan?.name || 'Plan actif'}
                      </Text>
                      <Text style={styles.planDetails}>
                        {subscription.price ? `${subscription.price}€` : ''} / {subscription.period || 'mois'}
                        {subscription.isActive !== false ? ' • Renouvelé automatiquement' : ''}
                      </Text>
                      {subscription.startDate && (
                        <Text style={styles.planDetails}>
                          Depuis le {new Date(subscription.startDate).toLocaleDateString('fr-FR')}
                        </Text>
                      )}
                      {subscription.endDate && (
                        <Text style={styles.planDetails}>
                          Jusqu&apos;au {new Date(subscription.endDate).toLocaleDateString('fr-FR')}
                        </Text>
                      )}
                    </View>
                    <View style={styles.statusChipActive}>
                      <Text style={styles.statusChipText}>
                        {subscription.isActive !== false ? 'Actif' : 'Inactif'}
                      </Text>
                    </View>
                  </View>
                  {subscription.isActive !== false && (
                    <TouchableOpacity>
                      <Text style={styles.cancelLink}>Résilier l&apos;abonnement</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Abonnement</Text>
                  </View>
                  <View style={styles.noSubscriptionContainer}>
                    <Ionicons name="card-outline" size={32} color={Colors.text.secondary} />
                    <Text style={styles.noSubscriptionText}>Aucun abonnement actif</Text>
                    <TouchableOpacity style={styles.subscribeButton}>
                      <Text style={styles.subscribeButtonText} onPress={() => router.push('/subscription')}>S&apos;abonner</Text>
                    </TouchableOpacity> 
                  </View>
                </View>
              )}

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
                    <Text style={styles.paymentSubtitle}>{userInfo?.email || user?.email || 'email@example.com'}</Text>
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

           
          </View>

              {/* Déconnexion */}
              <View style={styles.logoutContainer}>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} >
                  <Ionicons name="log-out" size={20} color="#EF4444" />
                  <Text style={styles.logoutText}>Se déconnecter</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          </ScrollView>
        </SafeAreaView>

        {/* Modal de debug des utilisateurs */}
        <DebugUsersViewer 
          visible={showDebugUsers} 
          onClose={() => setShowDebugUsers(false)} 
        />
      </LinearGradient>
    </NavigationTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  } as ViewStyle,
  safeArea: {
    flex: 1,
  } as ViewStyle,
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    marginBottom: Spacing.sm,
  } as ViewStyle,
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.light,
    marginBottom: Spacing.xs,
  } as TextStyle,
  subtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
  } as TextStyle,
  content: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing['2xl'],
  } as ViewStyle,
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    ...Shadows.md,
    maxWidth: '100%',
  } as ViewStyle,
  avatarBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Shadows.sm,
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    ...Shadows.sm,
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
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: Spacing.sm,
  } as TextStyle,
  ghostButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    ...Shadows.xs,
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  } as ViewStyle,
  logoutContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.sm,
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
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  } as ViewStyle,
  menuText: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.text.primary,
    marginLeft: Spacing.md,
  } as TextStyle,
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
    gap: Spacing.md,
  } as ViewStyle,
  loadingText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
  } as TextStyle,
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  } as ViewStyle,
  refreshButton: {
    padding: Spacing.xs,
  } as ViewStyle,
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  } as ViewStyle,
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  } as ViewStyle,
  userInfoText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    flex: 1,
  } as TextStyle,
  infoList: {
    gap: Spacing.sm,
  } as ViewStyle,
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  } as ViewStyle,
  infoLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.muted,
    minWidth: 120,
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  infoValue: {
    fontSize: Typography.sizes.base,
    color: Colors.text.light,
    fontWeight: Typography.weights.medium as any,
    flex: 1,
  } as TextStyle,
  loadingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  } as ViewStyle,
  loadingSectionText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  noSubscriptionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  } as ViewStyle,
  noSubscriptionText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  } as TextStyle,
  subscribeButton: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
  } as ViewStyle,
  subscribeButtonText: {
    color: 'white',
    fontSize: Typography.sizes.base,
    fontWeight: '700',
  } as TextStyle,
});