import { NavigationTransition } from '@/components/common/navigation-transition';
import { DebugUsersViewer } from '@/components/debug-users-viewer';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { SubscriptionsApi } from '@/features/subscription/services/subscriptionsApi';
import { useAuth } from '@/hooks/use-auth';
import { AuthService } from '@/services/auth.service';
import { responsiveSpacing } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { EditProfileModal } from '../components/EditProfileModal';
import { MenuSection } from '../components/MenuSection';
import { PersonalInfoSection } from '../components/PersonalInfoSection';
import { ProfileHeader } from '../components/ProfileHeader';
import { SettingsSection } from '../components/SettingsSection';
import { SubscriptionSection } from '../components/SubscriptionSection';

export default function ProfileScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [faceId, setFaceId] = useState(true);
  const [showDebugUsers, setShowDebugUsers] = useState(false);
  const { signOut, user, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  
  // États pour les informations complètes
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

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
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.title}>Mon Profil</Text>
                <Text style={styles.subtitle}>Gérez votre compte et préférences</Text>
              </View>
            </View>
          </View>

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
              {/* Carte Profil avec gradient */}
              <ProfileHeader
                userInfo={userInfo}
                user={user}
                hasSubscription={hasSubscription}
                onRefresh={handleRefresh}
                onAvatarUpdate={handleAvatarUpdate}
              />

              {/* Informations personnelles */}
              <PersonalInfoSection
                userInfo={userInfo}
                onEditPress={() => setShowEditModal(true)}
              />

              {/* Abonnement */}
              <SubscriptionSection
                subscription={subscription}
                hasSubscription={hasSubscription}
                loading={subscriptionLoading}
                onSubscriptionUpdate={handleRefreshSubscription}
              />

              {/* Paramètres */}
              <SettingsSection
                pushEnabled={pushEnabled}
                darkMode={darkMode}
                faceId={faceId}
                onPushToggle={setPushEnabled}
                onDarkModeToggle={setDarkMode}
                onFaceIdToggle={setFaceId}
              />

              {/* Liens rapides */}
              <MenuSection
                items={[
                  { icon: 'download-outline', label: 'Factures et reçus' },
                  { icon: 'notifications-outline', label: 'Notifications' },
                  { icon: 'shield-checkmark-outline', label: 'Sécurité' },
                  { icon: 'help-circle-outline', label: 'Aide et support' },
                ]}
              />

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

        {/* Modal d'édition des informations personnelles */}
        <EditProfileModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    marginBottom: Spacing.sm,
  } as ViewStyle,
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  } as ViewStyle,
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: '900',
    color: Colors.text.light,
    marginBottom: Spacing.xs,
    letterSpacing: -1,
  } as TextStyle,
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '500',
  } as TextStyle,
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
