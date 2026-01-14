import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
      {/* En-tête avec dégradé */}
      <LinearGradient
        colors={['rgba(139, 47, 63, 0.2)', 'rgba(139, 47, 63, 0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <Ionicons name="bar-chart" size={28} color="#8B2F3F" />
        <View style={styles.headerTextContainer}>
          <Text style={styles.sectionTitle}>Statistiques détaillées</Text>
          <Text style={styles.sectionSubtitle}>Vue d'ensemble de vos performances</Text>
        </View>
      </LinearGradient>
      
      {/* Statistiques de scans par période - Grid amélioré */}
      <View style={styles.scanStatsGrid}>
        <LinearGradient
          colors={['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.scanStatCard}
        >
          <View style={[styles.scanStatIcon, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]}>
            <Ionicons name="today-outline" size={28} color={Colors.status.success} />
          </View>
          {scanCountsLoading ? (
            <ActivityIndicator size="small" color={Colors.status.success} style={{ marginVertical: 8 }} />
          ) : (
            <>
              <Text style={[styles.scanStatValue, { color: Colors.status.success }]}>
                {scanCounts.today.toLocaleString('fr-FR')}
              </Text>
              <View style={styles.scanStatBadge}>
                <Ionicons name="arrow-up" size={12} color={Colors.status.success} />
                <Text style={[styles.scanStatBadgeText, { color: Colors.status.success }]}>Aujourd'hui</Text>
              </View>
            </>
          )}
          <Text style={styles.scanStatLabel}>Scans du jour</Text>
        </LinearGradient>

        <LinearGradient
          colors={['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.scanStatCard}
        >
          <View style={[styles.scanStatIcon, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]}>
            <Ionicons name="calendar-outline" size={28} color="#3B82F6" />
          </View>
          {scanCountsLoading ? (
            <ActivityIndicator size="small" color="#3B82F6" style={{ marginVertical: 8 }} />
          ) : (
            <>
              <Text style={[styles.scanStatValue, { color: '#3B82F6' }]}>
                {scanCounts.week.toLocaleString('fr-FR')}
              </Text>
              <View style={styles.scanStatBadge}>
                <Ionicons name="trending-up" size={12} color="#3B82F6" />
                <Text style={[styles.scanStatBadgeText, { color: '#3B82F6' }]}>7 jours</Text>
              </View>
            </>
          )}
          <Text style={styles.scanStatLabel}>Cette semaine</Text>
        </LinearGradient>

        <LinearGradient
          colors={['rgba(139, 47, 63, 0.2)', 'rgba(139, 47, 63, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.scanStatCard}
        >
          <View style={[styles.scanStatIcon, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]}>
            <Ionicons name="calendar" size={28} color="#8B2F3F" />
          </View>
          {scanCountsLoading ? (
            <ActivityIndicator size="small" color="#8B2F3F" style={{ marginVertical: 8 }} />
          ) : (
            <>
              <Text style={[styles.scanStatValue, { color: '#8B2F3F' }]}>
                {scanCounts.month.toLocaleString('fr-FR')}
              </Text>
              <View style={styles.scanStatBadge}>
                <Ionicons name="stats-chart" size={12} color="#8B2F3F" />
                <Text style={[styles.scanStatBadgeText, { color: '#8B2F3F' }]}>30 jours</Text>
              </View>
            </>
          )}
          <Text style={styles.scanStatLabel}>Ce mois</Text>
        </LinearGradient>

        <LinearGradient
          colors={['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.scanStatCard}
        >
          <View style={[styles.scanStatIcon, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]}>
            <Ionicons name="trophy" size={28} color={Colors.accent.orange} />
          </View>
          {scanCountsLoading ? (
            <ActivityIndicator size="small" color={Colors.accent.orange} style={{ marginVertical: 8 }} />
          ) : (
            <>
              <Text style={[styles.scanStatValue, { color: Colors.accent.orange }]}>
                {scanCounts.total.toLocaleString('fr-FR')}
              </Text>
              <View style={styles.scanStatBadge}>
                <Ionicons name="star" size={12} color={Colors.accent.orange} />
                <Text style={[styles.scanStatBadgeText, { color: Colors.accent.orange }]}>Total</Text>
              </View>
            </>
          )}
          <Text style={styles.scanStatLabel}>Total des scans</Text>
        </LinearGradient>
      </View>

      {/* Indicateurs de performance - Design amélioré */}
      <View style={styles.performanceCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="pulse" size={22} color="#8B2F3F" />
          <Text style={styles.statsCardTitle}>Indicateurs clés</Text>
        </View>
        <View style={styles.performanceGrid}>
          <View style={styles.performanceItem}>
            <LinearGradient
              colors={['rgba(139, 47, 63, 0.3)', 'rgba(139, 47, 63, 0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.performanceIcon}
            >
              <Ionicons name="people" size={24} color="#8B2F3F" />
            </LinearGradient>
            <Text style={styles.performanceValue}>24</Text>
            <Text style={styles.performanceLabel}>Clients uniques</Text>
            <View style={styles.trendBadge}>
              <Ionicons name="arrow-up" size={10} color="#10B981" />
              <Text style={styles.trendText}>+12%</Text>
            </View>
          </View>
          <View style={styles.performanceItem}>
            <LinearGradient
              colors={['rgba(245, 158, 11, 0.3)', 'rgba(245, 158, 11, 0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.performanceIcon}
            >
              <Ionicons name="repeat" size={24} color="#F59E0B" />
            </LinearGradient>
            <Text style={styles.performanceValue}>2.3</Text>
            <Text style={styles.performanceLabel}>Visites moy./client</Text>
            <View style={styles.trendBadge}>
              <Ionicons name="arrow-up" size={10} color="#10B981" />
              <Text style={styles.trendText}>+8%</Text>
            </View>
          </View>
          <View style={styles.performanceItem}>
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.3)', 'rgba(16, 185, 129, 0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.performanceIcon}
            >
              <Ionicons name="card" size={24} color="#10B981" />
            </LinearGradient>
            <Text style={styles.performanceValue}>24.45€</Text>
            <Text style={styles.performanceLabel}>Panier moyen</Text>
            <View style={styles.trendBadge}>
              <Ionicons name="arrow-up" size={10} color="#10B981" />
              <Text style={styles.trendText}>+15%</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Top clients - Design moderne */}
      <View style={styles.statsCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="trophy" size={22} color="#F59E0B" />
          <Text style={styles.statsCardTitle}>Top clients</Text>
        </View>
        {[
          { name: 'Marie Dupont', visits: 12, total: 186.50, icon: '👑' },
          { name: 'Jean Martin', visits: 8, total: 124.75, icon: '🥈' },
          { name: 'Sophie Bernard', visits: 6, total: 98.00, icon: '🥉' },
        ].map((client, index) => (
          <LinearGradient
            key={index}
            colors={
              index === 0
                ? ['rgba(245, 158, 11, 0.15)', 'rgba(245, 158, 11, 0.05)']
                : ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.topClientItem}
          >
            <View style={[
              styles.topClientRank,
              index === 0 && styles.topClientRankGold,
              index === 1 && styles.topClientRankSilver,
              index === 2 && styles.topClientRankBronze,
            ]}>
              <Text style={styles.topClientRankEmoji}>{client.icon}</Text>
            </View>
            <View style={styles.topClientInfo}>
              <Text style={styles.topClientName}>{client.name}</Text>
              <View style={styles.topClientDetailsRow}>
                <View style={styles.topClientStat}>
                  <Ionicons name="repeat-outline" size={14} color={Colors.text.secondary} />
                  <Text style={styles.topClientDetails}>{client.visits} visites</Text>
                </View>
                <View style={styles.topClientStat}>
                  <Ionicons name="cash-outline" size={14} color="#10B981" />
                  <Text style={[styles.topClientDetails, { color: '#10B981', fontWeight: '700' }]}>
                    {client.total.toFixed(2)}€
                  </Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
          </LinearGradient>
        ))}
      </View>

      {/* Heures de pointe - Design amélioré */}
      <View style={styles.statsCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="time" size={22} color="#3B82F6" />
          <Text style={styles.statsCardTitle}>Heures de pointe</Text>
        </View>
        <Text style={styles.peakHoursSubtitle}>Affluence par tranche horaire</Text>
        <View style={styles.peakHoursContainer}>
          {[
            { hour: '10h', value: 15, icon: 'sunny-outline', color: '#FCD34D' },
            { hour: '12h', value: 45, icon: 'restaurant-outline', color: '#F59E0B' },
            { hour: '14h', value: 30, icon: 'cafe-outline', color: '#8B2F3F' },
            { hour: '18h', value: 60, icon: 'moon-outline', color: '#3B82F6' },
            { hour: '20h', value: 25, icon: 'moon', color: '#6366F1' },
          ].map((item, index) => (
            <View key={index} style={styles.peakHourItem}>
              <View style={styles.peakHourLabelContainer}>
                <Ionicons name={item.icon as any} size={16} color={item.color} />
                <Text style={styles.peakHourLabel}>{item.hour}</Text>
              </View>
              <View style={styles.peakHourBarContainer}>
                <LinearGradient
                  colors={[item.color, `${item.color}80`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.peakHourBar, { width: `${item.value}%` }]}
                />
              </View>
              <View style={styles.peakHourValueContainer}>
                <Text style={[styles.peakHourValue, { color: item.color }]}>{item.value}</Text>
                {item.value >= 50 && (
                  <Ionicons name="flame" size={12} color="#EF4444" style={{ marginLeft: 2 }} />
                )}
              </View>
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
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(139, 47, 63, 0.3)',
    ...Shadows.lg,
  } as ViewStyle,
  headerTextContainer: {
    flex: 1,
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    color: Colors.text.light,
    marginBottom: 2,
    letterSpacing: -0.5,
  } as TextStyle,
  sectionSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '500',
  } as TextStyle,
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.lg,
  } as ViewStyle,
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  } as ViewStyle,
  statsCardTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '800',
    color: Colors.text.light,
    letterSpacing: -0.3,
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
    ...Shadows.lg,
  } as ViewStyle,
  performanceGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  } as ViewStyle,
  performanceItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  performanceIcon: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.md,
  } as ViewStyle,
  performanceValue: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '900',
    color: Colors.text.light,
    marginBottom: 4,
    letterSpacing: -0.5,
  } as TextStyle,
  performanceLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: Spacing.xs,
  } as TextStyle,
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  } as ViewStyle,
  trendText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  } as TextStyle,
  scanStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  } as ViewStyle,
  scanStatCard: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.xl,
  } as ViewStyle,
  scanStatIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.md,
  } as ViewStyle,
  scanStatValue: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: '900',
    marginBottom: Spacing.xs,
    letterSpacing: -1,
  } as TextStyle,
  scanStatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: Spacing.xs,
  } as ViewStyle,
  scanStatBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  } as TextStyle,
  scanStatLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  topClientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Shadows.sm,
  } as ViewStyle,
  topClientRank: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(139, 47, 63, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(139, 47, 63, 0.3)',
  } as ViewStyle,
  topClientRankGold: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#F59E0B',
    ...Shadows.md,
  } as ViewStyle,
  topClientRankSilver: {
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    borderColor: '#94A3B8',
  } as ViewStyle,
  topClientRankBronze: {
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
    borderColor: '#D97706',
  } as ViewStyle,
  topClientRankEmoji: {
    fontSize: 18,
  } as TextStyle,
  topClientInfo: {
    flex: 1,
  } as ViewStyle,
  topClientName: {
    fontSize: Typography.sizes.base,
    fontWeight: '800',
    color: Colors.text.light,
    marginBottom: 4,
    letterSpacing: -0.2,
  } as TextStyle,
  topClientDetailsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  } as ViewStyle,
  topClientStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  topClientDetails: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '600',
  } as TextStyle,
  peakHoursSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    fontWeight: '500',
  } as TextStyle,
  peakHoursContainer: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  } as ViewStyle,
  peakHourItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  peakHourLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 60,
  } as ViewStyle,
  peakHourLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: '800',
    color: Colors.text.light,
  } as TextStyle,
  peakHourBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  } as ViewStyle,
  peakHourBar: {
    height: '100%',
    borderRadius: BorderRadius.full,
  } as ViewStyle,
  peakHourValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
    justifyContent: 'flex-end',
  } as ViewStyle,
  peakHourValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: '800',
    textAlign: 'right',
  } as TextStyle,
});
