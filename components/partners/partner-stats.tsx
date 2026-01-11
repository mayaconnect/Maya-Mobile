import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

interface PartnerStatsProps {
  scanCounts: {
    today: number;
    week: number;
    month: number;
    total: number;
  };
  scanCountsLoading: boolean;
}

export function PartnerStats({ scanCounts, scanCountsLoading }: PartnerStatsProps) {
  return (
    <View style={styles.statsSection}>
      <Text style={styles.sectionTitle}>Statistiques détaillées</Text>
      
      {/* Statistiques de scans par période */}
      <View style={styles.statsCard}>
        <Text style={styles.statsCardTitle}>Statistiques des scans</Text>
        <View style={styles.scanStatsGrid}>
          <View style={styles.scanStatCard}>
            <View style={[styles.scanStatIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="today-outline" size={24} color={Colors.status.success} />
            </View>
            {scanCountsLoading ? (
              <ActivityIndicator size="small" color={Colors.status.success} style={{ marginVertical: 8 }} />
            ) : (
              <Text style={styles.scanStatValue}>
                {scanCounts.today.toLocaleString('fr-FR')}
              </Text>
            )}
            <Text style={styles.scanStatLabel}>Aujourd&apos;hui</Text>
          </View>
          <View style={styles.scanStatCard}>
            <View style={[styles.scanStatIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
            </View>
            {scanCountsLoading ? (
              <ActivityIndicator size="small" color="#3B82F6" style={{ marginVertical: 8 }} />
            ) : (
              <Text style={styles.scanStatValue}>
                {scanCounts.week.toLocaleString('fr-FR')}
              </Text>
            )}
            <Text style={styles.scanStatLabel}>7 derniers jours</Text>
          </View>
          <View style={styles.scanStatCard}>
            <View style={[styles.scanStatIcon, { backgroundColor: 'rgba(139, 47, 63, 0.15)' }]}>
              <Ionicons name="calendar" size={24} color="#8B2F3F" />
            </View>
            {scanCountsLoading ? (
              <ActivityIndicator size="small" color="#8B2F3F" style={{ marginVertical: 8 }} />
            ) : (
              <Text style={styles.scanStatValue}>
                {scanCounts.month.toLocaleString('fr-FR')}
              </Text>
            )}
            <Text style={styles.scanStatLabel}>30 derniers jours</Text>
          </View>
          <View style={styles.scanStatCard}>
            <View style={[styles.scanStatIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="stats-chart" size={24} color={Colors.accent.orange} />
            </View>
            {scanCountsLoading ? (
              <ActivityIndicator size="small" color={Colors.accent.orange} style={{ marginVertical: 8 }} />
            ) : (
              <Text style={styles.scanStatValue}>
                {scanCounts.total.toLocaleString('fr-FR')}
              </Text>
            )}
            <Text style={styles.scanStatLabel}>Total</Text>
          </View>
        </View>
      </View>

      {/* Indicateurs de performance */}
      <View style={styles.performanceCard}>
        <Text style={styles.statsCardTitle}>Indicateurs de performance</Text>
        <View style={styles.performanceGrid}>
          <View style={styles.performanceItem}>
            <View style={[styles.performanceIcon, { backgroundColor: 'rgba(139, 47, 63, 0.25)' }]}>
              <Ionicons name="people" size={20} color="#8B2F3F" />
            </View>
            <Text style={styles.performanceValue}>24</Text>
            <Text style={styles.performanceLabel}>Clients uniques</Text>
          </View>
          <View style={styles.performanceItem}>
            <View style={[styles.performanceIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="time" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.performanceValue}>2.3</Text>
            <Text style={styles.performanceLabel}>Visites moy./client</Text>
          </View>
          <View style={styles.performanceItem}>
            <View style={[styles.performanceIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="cash" size={20} color="#10B981" />
            </View>
            <Text style={styles.performanceValue}>24.45€</Text>
            <Text style={styles.performanceLabel}>Panier moyen</Text>
          </View>
        </View>
      </View>

      {/* Top clients */}
      <View style={styles.statsCard}>
        <Text style={styles.statsCardTitle}>Top clients</Text>
        {[
          { name: 'Marie Dupont', visits: 12, total: 186.50 },
          { name: 'Jean Martin', visits: 8, total: 124.75 },
          { name: 'Sophie Bernard', visits: 6, total: 98.00 },
        ].map((client, index) => (
          <View key={index} style={styles.topClientItem}>
            <View style={styles.topClientRank}>
              <Text style={styles.topClientRankText}>#{index + 1}</Text>
            </View>
            <View style={styles.topClientInfo}>
              <Text style={styles.topClientName}>{client.name}</Text>
              <Text style={styles.topClientDetails}>
                {client.visits} visites • {client.total.toFixed(2)}€
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
          </View>
        ))}
      </View>

      {/* Heures de pointe */}
      <View style={styles.statsCard}>
        <Text style={styles.statsCardTitle}>Heures de pointe</Text>
        <View style={styles.peakHoursContainer}>
          {[
            { hour: '10h', value: 15 },
            { hour: '12h', value: 45 },
            { hour: '14h', value: 30 },
            { hour: '18h', value: 60 },
            { hour: '20h', value: 25 },
          ].map((item, index) => (
            <View key={index} style={styles.peakHourItem}>
              <Text style={styles.peakHourLabel}>{item.hour}</Text>
              <View style={styles.peakHourBarContainer}>
                <View style={[styles.peakHourBar, { width: `${item.value}%` }]} />
              </View>
              <Text style={styles.peakHourValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsSection: {
    marginBottom: Spacing.lg,
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: Spacing.md,
  } as TextStyle,
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  } as ViewStyle,
  statsCardTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: Spacing.md,
  } as TextStyle,
  chartContainer: {
    marginTop: Spacing.md,
  } as ViewStyle,
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 150,
    paddingHorizontal: Spacing.sm,
  } as ViewStyle,
  chartBarWrapper: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  } as ViewStyle,
  chartBar: {
    width: '80%',
    backgroundColor: '#8B2F3F',
    borderRadius: BorderRadius.sm,
    minHeight: 20,
    marginBottom: Spacing.xs,
    shadowColor: '#8B2F3F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  } as ViewStyle,
  chartLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: '600',
  } as TextStyle,
  periodStatsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  } as ViewStyle,
  periodStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.md,
  } as ViewStyle,
  periodStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  } as ViewStyle,
  periodStatLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  } as TextStyle,
  periodStatValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    color: Colors.text.light,
    marginBottom: Spacing.xs,
  } as TextStyle,
  periodStatTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  periodStatTrendText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: '#10B981',
  } as TextStyle,
  performanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  } as ViewStyle,
  performanceGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  } as ViewStyle,
  performanceItem: {
    flex: 1,
    alignItems: 'center',
  } as ViewStyle,
  performanceIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(139, 47, 63, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  } as ViewStyle,
  performanceValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    color: Colors.text.light,
    marginBottom: Spacing.xs,
  } as TextStyle,
  performanceLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontWeight: '500',
  } as TextStyle,
  scanStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.md,
  } as ViewStyle,
  scanStatCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  } as ViewStyle,
  scanStatIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  } as ViewStyle,
  scanStatValue: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '800',
    color: Colors.text.light,
    marginBottom: Spacing.xs,
  } as TextStyle,
  scanStatLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: '600',
    textAlign: 'center',
  } as TextStyle,
  topClientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 47, 63, 0.2)',
  } as ViewStyle,
  topClientRank: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(139, 47, 63, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  } as ViewStyle,
  topClientRankText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '800',
    color: '#8B2F3F',
  } as TextStyle,
  topClientInfo: {
    flex: 1,
  } as ViewStyle,
  topClientName: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: 2,
  } as TextStyle,
  topClientDetails: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  peakHoursContainer: {
    marginTop: Spacing.md,
  } as ViewStyle,
  peakHourItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  } as ViewStyle,
  peakHourLabel: {
    width: 40,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
  } as TextStyle,
  peakHourBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(139, 47, 63, 0.2)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  } as ViewStyle,
  peakHourBar: {
    height: '100%',
    backgroundColor: '#8B2F3F',
    borderRadius: BorderRadius.full,
  } as ViewStyle,
  peakHourValue: {
    width: 30,
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.text.light,
    textAlign: 'right',
  } as TextStyle,
});
