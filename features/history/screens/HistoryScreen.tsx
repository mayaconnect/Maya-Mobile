import { NavigationTransition } from '@/components/common/navigation-transition';
import { SavingsByCategory } from '@/components/home/savings-by-category';
import { UserTransactionsHistory } from '@/components/home/user-transactions-history';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import { TransactionsApi } from '@/features/home/services/transactionsApi';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HistoryHeader } from '../components/HistoryHeader';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    if (!user?.id) {
      setError('Utilisateur non connecté');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📊 [History] Chargement des transactions pour l\'utilisateur:', user.id);

      const response = await TransactionsApi.getUserTransactions(user.id, {
        page: 1,
        pageSize: 100,
      });

      console.log('✅ [History] Transactions chargées:', response.items.length);

      setTransactions(response.items || []);
    } catch (err) {
      console.error('❌ [History] Erreur lors du chargement:', err);

      let errorMessage = 'Impossible de charger l\'historique';
      if (err instanceof Error) {
        if (err.message.includes('401')) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        } else if (err.message.includes('403')) {
          errorMessage = 'Accès refusé.';
        } else if (err.message.includes('404')) {
          errorMessage = 'Aucune transaction trouvée.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
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
          <HistoryHeader loading={loading} transactionsCount={transactions.length} />

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Économies par catégorie */}
            {user?.id && <SavingsByCategory userId={user.id} />}

            {/* Historique des transactions */}
            <UserTransactionsHistory
              transactions={transactions}
              transactionsLoading={loading}
              transactionsError={error}
              onRefresh={loadTransactions}
            />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </NavigationTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.light,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
});
