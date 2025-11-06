import { NavigationTransition } from '@/components/common/navigation-transition';
import { HistoryHeader } from '@/components/headers/history-header';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HistoryScreen() {
  const transactions = [
    { id: 1, partner: 'Café des Arts', amount: '2.50€', discount: '10%', date: 'Aujourd\'hui' },
    { id: 2, partner: 'Bistro Le Marché', amount: '15.30€', discount: '15%', date: 'Hier' },
    { id: 3, partner: 'Boutique Mode', amount: '45.00€', discount: '20%', date: 'Il y a 2 jours' },
  ];

  return (
    <NavigationTransition>
      <View style={styles.container}>
        <HistoryHeader
          title="Historique"
          subtitle={`${transactions.length} transactions récentes`}
          totalTransactions={transactions.length}
          onFilterPress={() => console.log('Filtres')}
          onNotificationPress={() => console.log('Notifications')}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {transactions.map((transaction) => (
            <TouchableOpacity key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionInfo}>
                <Text style={styles.partnerName}>{transaction.partner}</Text>
                <Text style={styles.date}>{transaction.date}</Text>
              </View>
              <View style={styles.transactionAmount}>
                <Text style={styles.amount}>{transaction.amount}</Text>
                <Text style={styles.discount}>-{transaction.discount}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </NavigationTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.light,
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
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  transactionInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  date: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  discount: {
    fontSize: Typography.sizes.sm,
    color: Colors.status.success,
    fontWeight: Typography.weights.semibold,
  },
});