import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

interface PartnerRecentTransactionsProps {
  transactions: any[];
  onViewAll?: () => void;
}

export const PartnerRecentTransactions: React.FC<PartnerRecentTransactionsProps> = ({
  transactions = [],
  onViewAll,
}) => {
  const recentTransactions = transactions.slice(0, 4);

  const getInitials = (firstName?: string, lastName?: string, name?: string) => {
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  const getPlanType = (transaction: any): string => {
    const planCode = transaction.planCode || transaction.plan?.code || transaction.subscription?.planCode;
    if (planCode?.toLowerCase().includes('family') || planCode?.toLowerCase().includes('famille')) {
      return 'famille';
    }
    if (planCode?.toLowerCase().includes('duo')) {
      return 'duo';
    }
    if (planCode?.toLowerCase().includes('entreprise') || planCode?.toLowerCase().includes('company')) {
      return 'entreprise';
    }
    return 'individuel';
  };

  const formatTime = (date: Date | string | number): string => {
    const d = new Date(date);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (recentTransactions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions récentes</Text>
        {onViewAll && (
          <TouchableOpacity
            onPress={onViewAll}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>Voir tout →</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.transactionsList}>
        {recentTransactions.map((transaction, index) => {
          const customer = transaction.customer || transaction.client || {};
          const firstName = customer.firstName || '';
          const lastName = customer.lastName || '';
          const customerName = customer.name || `${firstName} ${lastName}`.trim() || 'Client inconnu';
          const initials = getInitials(firstName, lastName, customerName);
          const planType = getPlanType(transaction);
          const amount = transaction.amountGross || transaction.amount || 0;
          const discountAmount = transaction.discountAmount || transaction.discount || 0;
          const transactionTime = formatTime(transaction.createdAt || transaction.date || transaction.transactionDate);

          return (
            <View key={transaction.id || transaction.transactionId || index} style={styles.transactionItem}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              </View>
              <View style={styles.transactionContent}>
                <View style={styles.transactionHeader}>
                  <Text style={styles.customerName} numberOfLines={1}>
                    {customerName.length > 20 ? customerName.substring(0, 20) + '...' : customerName}
                  </Text>
                  <Text style={styles.transactionTime}>{transactionTime}</Text>
                </View>
                <Text style={styles.planType}>{planType}</Text>
              </View>
              <View style={styles.transactionAmounts}>
                <Text style={styles.amount}>{amount.toFixed(2)}€</Text>
                {discountAmount > 0 && (
                  <Text style={styles.discount}>Remise: {discountAmount.toFixed(2)}€</Text>
                )}
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
    fontWeight: '900',
    color: Colors.text.light,
    letterSpacing: -0.3,
  } as TextStyle,
  viewAllText: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  } as TextStyle,
  transactionsList: {
    gap: Spacing.sm,
  } as ViewStyle,
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: Spacing.md,
  } as ViewStyle,
  avatarContainer: {
    marginRight: Spacing.xs,
  } as ViewStyle,
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  avatarText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  } as TextStyle,
  transactionContent: {
    flex: 1,
  } as ViewStyle,
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  } as ViewStyle,
  customerName: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.light,
    flex: 1,
  } as TextStyle,
  transactionTime: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: Spacing.sm,
  } as TextStyle,
  planType: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.6)',
  } as TextStyle,
  transactionAmounts: {
    alignItems: 'flex-end',
  } as ViewStyle,
  amount: {
    fontSize: Typography.sizes.base,
    fontWeight: '800',
    color: Colors.text.light,
    marginBottom: 2,
  } as TextStyle,
  discount: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: '#10B981',
  } as TextStyle,
});

