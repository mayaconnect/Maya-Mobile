import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

interface HomeStatsCardsProps {
  totalSavings?: number;
  totalTransactions?: number;
  totalPartners?: number;
  savingsThisMonth?: number;
  transactionsThisMonth?: number;
  newPartners?: number;
}

export const HomeStatsCards: React.FC<HomeStatsCardsProps> = ({
  totalSavings = 0,
  totalTransactions = 0,
  totalPartners = 0,
  savingsThisMonth = 0,
  transactionsThisMonth = 0,
  newPartners = 0,
}) => {
  return (
    <View style={styles.statsContainer}>
      <View style={[styles.statCard, styles.savingsCard]}>
        <View style={[styles.statIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
          <Ionicons name="trending-up" size={20} color="#10B981" />
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statValue}>{totalSavings.toFixed(2)}€</Text>
          <Text style={styles.statLabel}>Économies totales</Text>
          {savingsThisMonth > 0 && (
            <View style={styles.indicatorContainer}>
              <Text style={[styles.indicatorText, { color: '#10B981' }]}>+{savingsThisMonth.toFixed(0)}€ ce mois</Text>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.statCard, styles.transactionsCard]}>
        <View style={[styles.statIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
          <Ionicons name="receipt" size={20} color="#3B82F6" />
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statValue}>{totalTransactions}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
          {transactionsThisMonth > 0 && (
            <View style={styles.indicatorContainer}>
              <Text style={[styles.indicatorText, { color: '#3B82F6' }]}>+{transactionsThisMonth} ce mois</Text>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.statCard, styles.partnersCard]}>
        <View style={[styles.statIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
          <Ionicons name="storefront" size={20} color="#8B5CF6" />
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statValue}>{totalPartners}</Text>
          <Text style={styles.statLabel}>Partenaires visités</Text>
          {newPartners > 0 && (
            <View style={styles.indicatorContainer}>
              <Text style={[styles.indicatorText, { color: '#8B5CF6' }]}>+{newPartners} nouveaux</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'column',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  } as ViewStyle,
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    ...Shadows.md,
    gap: Spacing.md,
  } as ViewStyle,
  savingsCard: {},
  transactionsCard: {},
  partnersCard: {},
  indicatorContainer: {
    marginTop: 2,
  } as ViewStyle,
  indicatorText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold as any,
  } as TextStyle,
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  statValue: {
    fontSize: 20,
    fontWeight: Typography.weights.extrabold as any,
    color: Colors.text.light,
    marginBottom: 2,
    letterSpacing: -0.3,
  } as TextStyle,
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: Typography.weights.semibold as any,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  } as TextStyle,
  statContent: {
    flex: 1,
  } as ViewStyle,
});

