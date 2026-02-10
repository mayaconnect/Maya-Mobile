import { NavigationTransition } from '@/components/common/navigation-transition';
import { DebugUsersViewer } from '@/components/debug-users-viewer';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { TransactionsApi } from '@/features/home/services/transactionsApi';
import { SubscriptionsApi } from '@/features/subscription/services/subscriptionsApi';
import { useAuth } from '@/hooks/use-auth';
import { AuthService } from '@/services/auth.service';
import { responsiveSpacing } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PersonalInfoModal } from '../components/PersonalInfoModal';
import { ProfileHeader } from '../components/ProfileHeader';
import { ProfileNavigationItem } from '../components/ProfileNavigationItem';

export default function ProfileScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [showDebugUsers, setShowDebugUsers] = useState(false);
  const { signOut, user, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  
  // États pour les informations complètes
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [showPersonalInfoModal, setShowPersonalInfoModal] = useState(false);
  
  // États pour les statistiques
  const [transactions, setTransactions] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

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
          hasAvatarBase64: !!info.avatarBase64,
          hasAvatarUrl: !!(info as any)?.avatarUrl,
          hasAvatar: !!(info as any)?.avatar,
          allKeys: Object.keys(info || {}),
        });
        setUserInfo(info);

        // Récupérer l'abonnement actif de l'utilisateur connecté
        setSubscriptionLoading(true);
        try {
          // D'abord vérifier si l'utilisateur a un abonnement
          const hasSub = await SubscriptionsApi.hasActiveSubscription();
          console.log('📦 [Profile] Vérification abonnement:', hasSub);

          if (hasSub) {
            // Si oui, récupérer les détails complets
            const sub = await SubscriptionsApi.getMyActiveSubscription();

            if (sub) {
              console.log('✅ [Profile] Abonnement actif récupéré:', {
                id: sub.id,
                planName: sub.planCode || sub.plan?.name,
                isActive: sub.isActive,
                startDate: sub.startedAt,
                expiresAt: sub.expiresAt,
              });
              setSubscription(sub);
              setHasSubscription(true);
            } else {
              console.log('ℹ️ [Profile] Aucun abonnement actif trouvé');
              setSubscription(null);
              setHasSubscription(false);
            }
          } else {
            console.log('ℹ️ [Profile] Pas d\'abonnement actif');
            setSubscription(null);
            setHasSubscription(false);
          }
        } catch (error) {
          console.warn('⚠️ [Profile] Impossible de récupérer l\'abonnement:', error);
          setSubscription(null);
          setHasSubscription(false);
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

  const handleRefreshSubscription = async () => {
    try {
      setSubscriptionLoading(true);
      const hasSub = await SubscriptionsApi.hasActiveSubscription();
      if (hasSub) {
        const sub = await SubscriptionsApi.getMyActiveSubscription();
        setSubscription(sub);
        setHasSubscription(true);
      } else {
        setSubscription(null);
        setHasSubscription(false);
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement de l\'abonnement:', error);
    } finally {
      setSubscriptionLoading(false);
    }
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

  const handleAvatarUpdate = async (updatedUser: any) => {
    setUserInfo(updatedUser);
    await refreshUser();
  };

  // Charger les transactions pour les statistiques
  const loadTransactions = useCallback(async () => {
    if (!user?.id) return;

    try {
      setStatsLoading(true);
      const response = await TransactionsApi.getUserTransactions(user.id, {
        page: 1,
        pageSize: 1000, // Charger toutes les transactions pour les stats
      });
      setTransactions(response.items || []);
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
      setTransactions([]);
    } finally {
      setStatsLoading(false);
    }
  }, [user]);

  // Calculer les statistiques
  const calculateStats = useCallback(() => {
    const totalSavings = transactions.reduce((sum, t) => sum + (t.discountAmount || 0), 0);
    const totalTransactions = transactions.length;
    const uniquePartners = new Set(transactions.map(t => t.partnerId || t.partnerName).filter(Boolean));
    const totalPartners = uniquePartners.size;

    // Calculer la date de membre depuis
    let memberSince = '';
    if (userInfo?.createdAt) {
      const createdDate = new Date(userInfo.createdAt);
      const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      memberSince = `${monthNames[createdDate.getMonth()]} ${createdDate.getFullYear()}`;
    } else if (user?.createdAt) {
      const createdDate = new Date(user.createdAt);
      const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      memberSince = `${monthNames[createdDate.getMonth()]} ${createdDate.getFullYear()}`;
    }

    return { totalSavings, totalTransactions, totalPartners, memberSince };
  }, [transactions, userInfo, user]);

  // Calculer les transactions du mois
  const getTransactionsThisMonth = useCallback(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return transactions.filter(t => {
      const transactionDate = new Date(t.createdAt || t.date || 0);
      return transactionDate >= startOfMonth;
    }).length;
  }, [transactions]);

  // Générer l'activité récente
  const getRecentActivity = useCallback(() => {
    const recentTransactions = transactions
      .slice(0, 3)
      .map((t, index) => {
        const transactionDate = new Date(t.createdAt || t.date || 0);
        const partnerName = t.partnerName || t.partner?.name || t.store?.partner?.name || t.store?.name || 'Partenaire inconnu';
        const discountAmount = t.discountAmount || 0;
        const amount = t.amountGross || t.amount || 0;
        
        const now = new Date();
        const diffTime = now.getTime() - transactionDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        let subtitle = '';
        if (diffDays === 0) {
          subtitle = `Aujourd'hui, ${transactionDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffDays === 1) {
          subtitle = `Hier, ${transactionDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
        } else {
          subtitle = `${diffDays} jours, ${transactionDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
        }

        return {
          id: t.id || t.transactionId || `transaction-${index}`,
          title: discountAmount > 0 ? `Transaction chez ${partnerName}` : `Scan QR ${partnerName}`,
          subtitle,
          amount: discountAmount > 0 ? `-${discountAmount.toFixed(2)}€` : undefined,
          amountColor: discountAmount > 0 ? '#10B981' : undefined,
          type: discountAmount > 0 ? 'transaction' as const : 'scan' as const,
        };
      });

    return recentTransactions;
  }, [transactions]);

  // Charger les transactions au démarrage
  useEffect(() => {
    if (user?.id && !user.email?.toLowerCase().includes('partner') && !user.email?.toLowerCase().includes('operator')) {
      loadTransactions();
    }
  }, [user, loadTransactions]);

  return (
    <NavigationTransition>
      <LinearGradient
        colors={Colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ScrollView
            style={styles.content}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, responsiveSpacing(90)) } // Navbar height (70) + safe area + margin
            ]}
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
              {/* Header Profil */}
              <ProfileHeader
                userInfo={userInfo}
                user={user}
                hasSubscription={hasSubscription}
                subscription={subscription}
                onRefresh={handleRefresh}
                onAvatarUpdate={handleAvatarUpdate}
              />

              

               {/* Informations personnelles et Abonnement - En bas */}
               <ProfileNavigationItem
                icon="person-outline"
                title="Informations personnelles"
                subtitle="Nom, email, téléphone"
                onPress={() => setShowPersonalInfoModal(true)}
              />

              <ProfileNavigationItem
                icon="card-outline"
                title="Abonnement & Facturation"
                subtitle={
                  hasSubscription && subscription
                    ? `${subscription.planCode || subscription.plan?.name || 'Plan famille'} • ${subscription.isActive ? 'Actif' : 'Inactif'}`
                    : 'Aucun abonnement actif'
                }
                onPress={() => router.push('/(tabs)/subscription')}
              />
              
              {/* Navigation Items - Dans l'ordre de l'image */}
              <ProfileNavigationItem
                icon="time-outline"
                title="Historique des transactions"
                subtitle={`${getTransactionsThisMonth()} transactions ce mois`}
                onPress={() => {
                  // Ouvrir la modal d'historique depuis HomeScreen
                  router.push('/(tabs)/home');
                }}
              />

              {/* <ProfileNavigationItem
                icon="notifications-outline"
                title="Notifications"
                subtitle="Gérer vos préférences"
                onPress={() => {
                  // TODO: Naviguer vers la page de notifications
                }}
              />

              <ProfileNavigationItem
                icon="lock-closed-outline"
                title="Sécurité & Confidentialité"
                subtitle="Mot de passe, 2FA"
                onPress={() => {
                  // TODO: Naviguer vers la page de sécurité
                }}
              />

              {/* Paramètres rapides */}
              {/* <ProfileSettingsSection
                darkMode={darkMode}
                pushEnabled={pushEnabled}
                weeklyReport={weeklyReport}
                onDarkModeToggle={setDarkMode}
                onPushToggle={setPushEnabled}
                onWeeklyReportToggle={setWeeklyReport}
              /> */}
              

             

             

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

        {/* Modal des informations personnelles */}
        <PersonalInfoModal
          visible={showPersonalInfoModal}
          onClose={() => setShowPersonalInfoModal(false)}
          userInfo={userInfo}
          onUpdate={async (updatedUser: any) => {
            setUserInfo(updatedUser);
            await refreshUser();
          }}
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
  content: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing['2xl'],
  } as ViewStyle,
  logoutContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    marginHorizontal: Spacing.sm,
  } as ViewStyle,
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    gap: Spacing.sm,
    ...Shadows.md,
  } as ViewStyle,
  logoutText: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: Typography.sizes.base,
    letterSpacing: 0.3,
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
});
