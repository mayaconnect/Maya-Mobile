import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';

interface HomeStatsCardsProps {
  totalSavings?: number;
  totalVisits?: number;
}

export const HomeStatsCards: React.FC<HomeStatsCardsProps> = ({
  totalSavings = 0,
  totalVisits = 0,
}) => {
  return (
    <View style={styles.statsContainer}>
      <View style={[styles.statCard, styles.savingsCard]}>
        <View style={[styles.statIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
          <Ionicons name="trending-up" size={24} color="#10B981" />
        </View>
        <Text style={styles.statValue}>{totalSavings.toFixed(2)}€</Text>
        <Text style={styles.statLabel}>Économies</Text>
      </View>

      <View style={[styles.statCard, styles.visitsCard]}>
        <View style={[styles.statIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
          <Ionicons name="calendar" size={24} color="#3B82F6" />
        </View>
        <Text style={styles.statValue}>{totalVisits}</Text>
        <Text style={styles.statLabel}>Visites</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  } as ViewStyle,
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Shadows.lg,
    alignItems: 'center',
  } as ViewStyle,
  savingsCard: {},
  visitsCard: {},
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  } as ViewStyle,
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

