import { NavigationTransition } from '@/components/common/navigation-transition';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { TransactionsApi } from '@/features/home/services/transactionsApi';
import { useAuth } from '@/hooks/use-auth';
import { responsiveSpacing } from '@/utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeNearbyOffers } from '../components/HomeNearbyOffers';
import { HomeNearbyStores } from '../components/HomeNearbyStores';
import { HomeQuickActions } from '../components/HomeQuickActions';
import { HomeRecentTransactions } from '../components/HomeRecentTransactions';
import { HomeStatsCards } from '../components/HomeStatsCards';
import { HomeWelcomeHeader } from '../components/HomeWelcomeHeader';
import { TransactionsHistoryModal } from '../components/TransactionsHistoryModal';

export default function HomeScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // États pour les transactions
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Vérifier si l'utilisateur est un partenaire ou un opérateur
  useEffect(() => {
    // Détecter si l'email contient "partner", "operator" ou si l'utilisateur a un rôle partenaire/opérateur
    const isPartner = user?.email?.toLowerCase().includes('partner') || 
                      user?.email?.toLowerCase().includes('partenaire') ||
                      user?.email?.toLowerCase().includes('operator') ||
                      user?.email?.toLowerCase().includes('opérateur') ||
                      (user as any)?.role === 'partner' ||
                      (user as any)?.role === 'operator' ||
                      (user as any)?.role === 'opérateur' ||
                      (user as any)?.role === 'StoreOperator' ||
                      (user as any)?.isPartner === true ||
                      (user as any)?.isOperator === true;
    
    if (isPartner) {
      // Rediriger vers l'interface partenaire
      router.replace('/(tabs)/partner-home');
    }
  }, [user]);

  // Charger les transactions de l'utilisateur
  const loadUserTransactions = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      setTransactionsLoading(true);
      setTransactionsError(null);

      console.log('📊 [Home] Chargement des transactions pour l\'utilisateur:', user.id);

      const response = await TransactionsApi.getUserTransactions(user.id, {
        page: 1,
        pageSize: 10, // Limiter à 10 dernières transactions
      });

      console.log('✅ [Home] Transactions reçues:', {
        count: response.items?.length || 0,
        totalCount: response.totalCount,
      });

      setTransactions(response.items || []);
    } catch (err) {
      console.error('❌ [Home] Erreur lors du chargement des transactions:', err);
      let errorMessage = 'Impossible de charger votre historique';

      if (err instanceof Error) {
        if (err.message.includes('401')) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        } else if (err.message.includes('403')) {
          errorMessage = 'Accès refusé.';
        } else {
          errorMessage = err.message;
        }
      }

      setTransactionsError(errorMessage);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  }, [user]);

  // Charger les transactions au démarrage
  useEffect(() => {
    if (user && !user.email?.toLowerCase().includes('partner') && !user.email?.toLowerCase().includes('operator')) {
      loadUserTransactions();
    }
  }, [loadUserTransactions, user]);

  return (
    <NavigationTransition delay={50}>
      <LinearGradient
        colors={Colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, responsiveSpacing(90)) } // Navbar height (70) + safe area + margin
          ]}
          showsVerticalScrollIndicator={false}
        >
            <HomeWelcomeHeader firstName={user?.firstName} lastName={user?.lastName} />

            {(() => {
              // Calculer les statistiques
              const totalSavings = transactions.reduce((sum, t) => sum + (t.discountAmount || 0), 0);
              const totalTransactions = transactions.length;
              
              // Calculer les statistiques mensuelles
              const now = new Date();
              const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
              const transactionsThisMonth = transactions.filter(t => {
                const transactionDate = new Date(t.createdAt || t.date || 0);
                return transactionDate >= startOfMonth;
              });
              const savingsThisMonth = transactionsThisMonth.reduce((sum, t) => sum + (t.discountAmount || 0), 0);
              
              // Compter les partenaires uniques visités
              const uniquePartners = new Set(transactions.map(t => t.partnerId || t.partnerName).filter(Boolean));
              const totalPartners = uniquePartners.size;
              
              // Compter les nouveaux partenaires ce mois
              const newPartnersThisMonth = new Set(
                transactionsThisMonth.map(t => t.partnerId || t.partnerName).filter(Boolean)
              ).size;

              return (
                <>
                  <HomeStatsCards
                    totalSavings={totalSavings}
                    totalTransactions={totalTransactions}
                    totalPartners={totalPartners}
                    savingsThisMonth={savingsThisMonth}
                    transactionsThisMonth={transactionsThisMonth.length}
                    newPartners={newPartnersThisMonth}
                  />

                  <HomeQuickActions onScanQR={() => {
                    router.push('/(tabs)/qrcode');
                  }} />

                  <HomeRecentTransactions 
                    transactions={transactions} 
                    onViewAll={() => setShowHistoryModal(true)}
                  />

                  <HomeNearbyStores />

                  <HomeNearbyOffers />
                </>
              );
            })()}
        </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      <TransactionsHistoryModal
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
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
  scrollContainer: {
    flex: 1,
  } as ViewStyle,
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  } as ViewStyle,
  welcomeHeader: {
    marginBottom: Spacing.xl,
  } as ViewStyle,
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  } as ViewStyle,
  welcomeTextContainer: {
    flex: 1,
  } as ViewStyle,
  welcomeText: {
    fontSize: Typography.sizes.base,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: Typography.weights.medium as any,
    marginBottom: 4,
  } as TextStyle,
  welcomeName: {
    fontSize: 32,
    fontWeight: Typography.weights.extrabold as any,
    color: Colors.text.light,
    letterSpacing: -0.8,
    marginBottom: 4,
  } as TextStyle,
  welcomeSubtitle: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  profileButton: {
    padding: 4,
  } as ViewStyle,
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  } as ViewStyle,
  quickAction: {
    flex: 1,
        borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Shadows.md,
  } as ViewStyle,
  quickActionIconBg: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  } as ViewStyle,
  quickActionText: {
    marginTop: 2,
    color: Colors.text.light,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold as any,
    textAlign: 'center',
  } as TextStyle,
  quickActionSubtext: {
    marginTop: 2,
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    fontWeight: Typography.weights.medium as any,
    textAlign: 'center',
  } as TextStyle,
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  } as ViewStyle,
  statCard: {
    flex: 1,
        borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Shadows.lg,
    alignItems: 'center',
  } as ViewStyle,
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  } as ViewStyle,
  savingsCard: {},
  visitsCard: {},
  statValue: {
    fontSize: 28,
    fontWeight: Typography.weights.extrabold as any,
    color: Colors.text.light,
    marginBottom: 4,
    letterSpacing: -0.5,
  } as TextStyle,
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: Typography.weights.semibold as any,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  } as TextStyle,
});
