import { NavigationTransition } from '@/components/common/navigation-transition';
import { UserTransactionsHistory } from '@/components/home/user-transactions-history';
import { Colors, Spacing, Typography } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import { TransactionsService } from '@/services/transactions.service';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

      const response = await TransactionsService.getUserTransactions(user.id, {
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
          <View style={styles.header}>
            <Text style={styles.title}>Historique des visites</Text>
            <Text style={styles.subtitle}>
              {loading ? 'Chargement...' : transactions.length > 0
                ? `${transactions.length} visite${transactions.length > 1 ? 's' : ''}`
                : 'Aucune visite'}
            </Text>
          </View>

          <View style={styles.content}>
            <UserTransactionsHistory
              transactions={transactions}
              transactionsLoading={loading}
              transactionsError={error}
              onRefresh={loadTransactions}
            />
          </View>
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    width: '100%',
    height: '100%',
  },
});