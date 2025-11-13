import { NavigationTransition } from '@/components/common/navigation-transition';
import { NeoCard } from '@/components/neo/NeoCard';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const gradient = ['#450A1D', '#120A18'] as const;

const mockKPIs = {
  visits: 1280,
  uniqueCustomers: 742,
  conversionRate: 0.64,
  averageTicket: 18.7,
  totalRevenue: 23840,
  savedAmount: 3120,
};

const mockTrends = [
  { label: 'Lun', value: 12 },
  { label: 'Mar', value: 18 },
  { label: 'Mer', value: 11 },
  { label: 'Jeu', value: 21 },
  { label: 'Ven', value: 24 },
  { label: 'Sam', value: 32 },
  { label: 'Dim', value: 17 },
];

const mockTopPartners = [
  { id: '1', name: 'Café des Arts', visits: 124, revenue: 1860 },
  { id: '2', name: 'Studio Fit', visits: 108, revenue: 1430 },
  { id: '3', name: 'Bistro Marché', visits: 96, revenue: 1720 },
];

export default function StatsScreen() {
  const maxTrend = useMemo(() => Math.max(...mockTrends.map((item) => item.value)), []);

  const formatCurrency = (value: number) =>
    value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

  const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

  return (
    <NavigationTransition>
      <View style={styles.screen}>
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFillObject} />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <StatusBar barStyle="light-content" />
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <NeoCard gradient={['#4C0F22', '#1A112A']} style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <Text style={styles.heroTitle}>Tableau de bord</Text>
                <Text style={styles.heroSubtitle}>Performance globale de vos QR codes</Text>
              </View>
              <View style={styles.heroHighlightRow}>
                <View style={styles.heroHighlight}>
                  <Text style={styles.heroHighlightValue}>{mockKPIs.visits.toLocaleString('fr-FR')}</Text>
                  <Text style={styles.heroHighlightLabel}>Visites validées</Text>
                </View>
                <View style={styles.heroSeparator} />
                <View style={styles.heroHighlight}>
                  <Text style={styles.heroHighlightValue}>{formatCurrency(mockKPIs.totalRevenue)}</Text>
                  <Text style={styles.heroHighlightLabel}>Chiffre d'affaires</Text>
                </View>
              </View>
            </NeoCard>

            <NeoCard variant="glass" style={styles.kpiGrid}>
              <View style={styles.kpiItem}>
                <View style={styles.kpiIcon}>
                  <Ionicons name="people-outline" size={18} color={Colors.accent.cyan} />
                </View>
                <Text style={styles.kpiValue}>{mockKPIs.uniqueCustomers.toLocaleString('fr-FR')}</Text>
                <Text style={styles.kpiLabel}>Clients uniques</Text>
              </View>
              <View style={styles.kpiItem}>
                <View style={[styles.kpiIcon, styles.kpiIconRose]}>
                  <Ionicons name="swap-vertical" size={18} color={Colors.accent.rose} />
                </View>
                <Text style={styles.kpiValue}>{formatPercent(mockKPIs.conversionRate)}</Text>
                <Text style={styles.kpiLabel}>Conversion</Text>
              </View>
              <View style={styles.kpiItem}>
                <View style={[styles.kpiIcon, styles.kpiIconGold]}>
                  <Ionicons name="pricetag" size={18} color={Colors.accent.gold} />
                </View>
                <Text style={styles.kpiValue}>{formatCurrency(mockKPIs.averageTicket)}</Text>
                <Text style={styles.kpiLabel}>Panier moyen</Text>
              </View>
              <View style={styles.kpiItem}>
                <View style={[styles.kpiIcon, styles.kpiIconEmerald]}>
                  <Ionicons name="trending-up" size={18} color={Colors.secondary[300]} />
                </View>
                <Text style={styles.kpiValue}>{formatCurrency(mockKPIs.savedAmount)}</Text>
                <Text style={styles.kpiLabel}>Économies générées</Text>
              </View>
            </NeoCard>

            <NeoCard variant="glass" style={styles.trendCard}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Trafic hebdomadaire</Text>
                  <Text style={styles.sectionSubtitle}>Visites validées par jour</Text>
                </View>
              </View>
              <View style={styles.trendChart}>
                {mockTrends.map((point) => {
                  const heightPercent = (point.value / maxTrend) * 100;
                  return (
                    <View key={point.label} style={styles.trendColumn}>
                      <View style={[styles.trendBar, { height: `${heightPercent}%` }]} />
                      <Text style={styles.trendLabel}>{point.label}</Text>
                    </View>
                  );
                })}
              </View>
            </NeoCard>

            <NeoCard variant="glass" style={styles.topListCard}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Meilleures performances</Text>
                  <Text style={styles.sectionSubtitle}>Top 3 des points de vente</Text>
                </View>
              </View>

              <View style={styles.topList}>
                {mockTopPartners.map((item, index) => (
                  <View key={item.id} style={styles.topListItem}>
                    <View style={styles.topListRank}>
                      <Text style={styles.topListRankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.topListInfo}>
                      <Text style={styles.topListName}>{item.name}</Text>
                      <Text style={styles.topListVisits}>{item.visits} visites</Text>
                    </View>
                    <Text style={styles.topListRevenue}>{formatCurrency(item.revenue)}</Text>
                  </View>
                ))}
              </View>
            </NeoCard>
          </ScrollView>
        </SafeAreaView>
      </View>
    </NavigationTransition>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background.dark,
  } as ViewStyle,
  safeArea: {
    flex: 1,
  } as ViewStyle,
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['4xl'],
    gap: Spacing['2xl'],
  } as ViewStyle,
  heroCard: {
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
    gap: Spacing['2xl'],
  } as ViewStyle,
  heroHeader: {
    gap: Spacing.xs,
  } as ViewStyle,
  heroTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
  heroSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  heroHighlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  } as ViewStyle,
  heroHighlight: {
    flex: 1,
    gap: Spacing.xs / 2,
  } as ViewStyle,
  heroHighlightValue: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
  heroHighlightLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  } as TextStyle,
  heroSeparator: {
    width: 1,
    height: 42,
    backgroundColor: 'rgba(255,255,255,0.12)',
  } as ViewStyle,
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    padding: Spacing.lg,
  } as ViewStyle,
  kpiItem: {
    flexBasis: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  } as ViewStyle,
  kpiIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(45,217,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  kpiIconRose: {
    backgroundColor: 'rgba(251,76,136,0.16)',
  } as ViewStyle,
  kpiIconGold: {
    backgroundColor: 'rgba(255,199,86,0.16)',
  } as ViewStyle,
  kpiIconEmerald: {
    backgroundColor: 'rgba(39,239,161,0.16)',
  } as ViewStyle,
  kpiValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
  kpiLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  } as TextStyle,
  trendCard: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  } as ViewStyle,
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
  sectionSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.muted,
  } as TextStyle,
  trendChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    height: 180,
  } as ViewStyle,
  trendColumn: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  } as ViewStyle,
  trendBar: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.accent.rose,
    shadowColor: Colors.accent.rose,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  } as ViewStyle,
  trendLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
  } as TextStyle,
  topListCard: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  } as ViewStyle,
  topList: {
    gap: Spacing.sm,
  } as ViewStyle,
  topListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  } as ViewStyle,
  topListRank: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(251,76,136,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251,76,136,0.35)',
  } as ViewStyle,
  topListRankText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.accent.rose,
  } as TextStyle,
  topListInfo: {
    flex: 1,
    gap: 4,
  } as ViewStyle,
  topListName: {
    fontSize: Typography.sizes.base,
    color: Colors.text.light,
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  topListVisits: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
  } as TextStyle,
  topListRevenue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.secondary[200],
  } as TextStyle,
});
