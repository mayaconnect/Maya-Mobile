import { SavingsByCategory } from '@/components/home/savings-by-category';
import { UserTransactionsHistory } from '@/components/home/user-transactions-history';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { TransactionsApi } from '@/features/home/services/transactionsApi';
import { HistoryHeader } from '@/features/history/components/HistoryHeader';
import { useAuth } from '@/hooks/use-auth';
import { responsiveSpacing } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface TransactionsHistoryModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TransactionsHistoryModal: React.FC<TransactionsHistoryModalProps> = ({
  visible,
  onClose,
}) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
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

      const response = await TransactionsApi.getUserTransactions(user.id, {
        page: 1,
        pageSize: 100,
      });

      setTransactions(response.items || []);
    } catch (err) {
      console.error('❌ [TransactionsModal] Erreur lors du chargement:', err);

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
    if (visible && user?.id) {
      loadTransactions();
    }
  }, [visible, user, loadTransactions]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={Colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.modalContainer}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.modalHeader}>
            <View style={styles.headerContent}>
              <HistoryHeader loading={loading} transactionsCount={transactions.length} />
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={Colors.text.light} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: Math.max(insets.bottom, responsiveSpacing(40)) }
            ]}
            showsVerticalScrollIndicator={false}
            bounces={true}
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
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  } as ViewStyle,
  safeArea: {
    flex: 1,
  } as ViewStyle,
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  } as ViewStyle,
  headerContent: {
    flex: 1,
  } as ViewStyle,
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xs,
  } as ViewStyle,
  scrollView: {
    flex: 1,
  } as ViewStyle,
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  } as ViewStyle,
});

