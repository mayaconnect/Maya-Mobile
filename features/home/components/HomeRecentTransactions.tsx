import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

interface Transaction {
  id?: string;
  partnerName?: string;
  partner?: {
    name?: string;
  };
  store?: {
    name?: string;
    partner?: {
      name?: string;
    };
  };
  amount?: number;
  totalAmount?: number;
  discountAmount?: number;
  savings?: number;
  createdAt?: string;
  created_at?: string;
  date?: string;
  timestamp?: string;
}

interface HomeRecentTransactionsProps {
  transactions: Transaction[];
  onViewAll?: () => void;
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Date inconnue';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Date inconnue';
  }
};

export const HomeRecentTransactions: React.FC<HomeRecentTransactionsProps> = ({
  transactions = [],
  onViewAll,
}) => {
  const recentTransactions = transactions.slice(0, 3);

  if (recentTransactions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions récentes</Text>
        <TouchableOpacity
          onPress={onViewAll}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText}>Voir tout →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.transactionsList}>
        {recentTransactions.map((transaction, index) => {
          // Extraire le nom du partenaire de différentes structures possibles
          const transactionDate = 
            transaction.createdAt ||
            transaction.created_at ||
            transaction.date ||
            transaction.timestamp ||
            '';
          const storeName = 
            transaction.partnerName ||
            transaction.partner?.name ||
            transaction.store?.partner?.name ||
            transaction.store?.name ||
            transaction.storeName ||
            'Partenaire';
          const amountGross = transaction.amountGross || transaction.amount || transaction.totalAmount || 0;
          const amountNet = transaction.amountNet || amountGross;
          const discount = transaction.avgDiscountPercent || transaction.discountPercent || transaction.discount || 0;
          const savings = transaction.discountAmount || transaction.savings || 0;
          const personsCount = transaction.personsCount || 0;

          return (
            <View key={transaction.id || `transaction-${index}`} style={styles.transactionCard}>
              {/* Header avec store et date */}
              <View style={styles.transactionHeader}>
                <View style={styles.transactionIcon}>
                  <Ionicons name="storefront" size={24} color="#8B2F3F" />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionStore}>{storeName}</Text>
                  <Text style={styles.transactionDate}>{formatDate(transactionDate)}</Text>
                </View>
              </View>

              {/* Détails de la transaction */}
              <View style={styles.transactionDetails}>
                {/* Montants */}
                <View style={styles.amountsRow}>
                  <View style={styles.amountItem}>
                    <Text style={styles.amountLabel}>Montant initial</Text>
                    <Text style={styles.amountValue}>{amountGross.toFixed(2)}€</Text>
                  </View>
                  {savings > 0 && (
                    <>
                      <Ionicons name="arrow-forward" size={16} color={Colors.text.secondary} />
                      <View style={styles.amountItem}>
                        <Text style={styles.amountLabel}>Montant payé</Text>
                        <Text style={[styles.amountValue, styles.amountNetValue]}>
                          {amountNet.toFixed(2)}€
                        </Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Économies et badges */}
                <View style={styles.badgesRow}>
                  {savings > 0 && (
                    <View style={styles.savingsContainer}>
                      <Ionicons name="pricetag" size={14} color="#10B981" />
                      <Text style={styles.savingsValue}>
                        Économisé : {savings.toFixed(2)}€
                      </Text>
                    </View>
                  )}
                  {discount > 0 && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>-{discount}%</Text>
                    </View>
                  )}
                  {personsCount > 0 && (
                    <View style={styles.personsBadge}>
                      <Ionicons name="people" size={14} color="#8B2F3F" />
                      <Text style={styles.personsText}>{personsCount} pers.</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  } as ViewStyle,
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.light,
    letterSpacing: -0.3,
  } as TextStyle,
  viewAllText: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  transactionsList: {
    gap: Spacing.md,
  } as ViewStyle,
  transactionCard: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  } as ViewStyle,
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  } as ViewStyle,
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(139, 47, 63, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  } as ViewStyle,
  transactionInfo: {
    flex: 1,
  } as ViewStyle,
  transactionStore: {
    fontSize: Typography.sizes.base,
    fontWeight: '700' as any,
    color: Colors.text.light,
    marginBottom: 4,
  } as TextStyle,
  transactionDate: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  transactionDetails: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  amountsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  } as ViewStyle,
  amountItem: {
    flex: 1,
  } as ViewStyle,
  amountLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginBottom: 4,
  } as TextStyle,
  amountValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700' as any,
    color: Colors.text.light,
  } as TextStyle,
  amountNetValue: {
    color: '#10B981',
  } as TextStyle,
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  } as ViewStyle,
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  } as ViewStyle,
  savingsValue: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700' as any,
    color: '#10B981',
  } as TextStyle,
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B2F3F',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  } as ViewStyle,
  discountText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700' as any,
    color: 'white',
  } as TextStyle,
  personsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 47, 63, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  } as ViewStyle,
  personsText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600' as any,
    color: '#8B2F3F',
  } as TextStyle,
});

