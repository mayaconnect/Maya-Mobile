import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

interface ProfileStatsProps {
  totalSavings: number;
  totalTransactions: number;
  totalPartners: number;
  memberSince: string; // Format: "Mars 2024"
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({
  totalSavings = 0,
  totalTransactions = 0,
  totalPartners = 0,
  memberSince = '',
}) => {
  return (
    <View style={styles.container}>
      {/* Top Row */}
      <View style={styles.row}>
        {/* Économies totales */}
        <View style={[styles.statCard, styles.savingsCard]}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>
            {totalSavings.toFixed(2)}€
          </Text>
          <Text style={styles.statLabel}>Économies totales</Text>
        </View>

        {/* Transactions */}
        <View style={[styles.statCard, styles.transactionsCard]}>
          <Text style={[styles.statValue, { color: '#3B82F6' }]}>
            {totalTransactions}
          </Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>
      </View>

      {/* Bottom Row */}
      <View style={styles.row}>
        {/* Partenaires visités */}
        <View style={[styles.statCard, styles.partnersCard]}>
          <Text style={[styles.statValue, { color: '#8B5CF6' }]}>
            {totalPartners}
          </Text>
          <Text style={styles.statLabel}>Partenaires visités</Text>
        </View>

        {/* Membre depuis */}
        <View style={[styles.statCard, styles.memberCard]}>
          <Text style={[styles.statValue, { color: '#F97316' }]}>
            {memberSince || 'N/A'}
          </Text>
          <Text style={styles.statLabel}>Membre depuis</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
    marginHorizontal: Spacing.sm,
    gap: Spacing.md,
  } as ViewStyle,
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  } as ViewStyle,
  statCard: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  } as ViewStyle,
  savingsCard: {
    // Specific styles if needed
  } as ViewStyle,
  transactionsCard: {
    // Specific styles if needed
  } as ViewStyle,
  partnersCard: {
    // Specific styles if needed
  } as ViewStyle,
  memberCard: {
    // Specific styles if needed
  } as ViewStyle,
  statValue: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '900',
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
  } as TextStyle,
  statLabel: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  } as TextStyle,
});

