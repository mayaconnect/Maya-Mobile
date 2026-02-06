import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';

interface PartnerStatsProps {
  transactions: any[];
  clients: any[];
  scanCounts: {
    today: number;
    week: number;
    month: number;
    total: number;
  };
  scanCountsLoading: boolean;
  onExport?: () => void;
}

export function PartnerStats({
  transactions = [],
  clients = [],
  scanCounts,
  scanCountsLoading,
  onExport,
}: PartnerStatsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30' | '90' | '365'>('30');

  // Calculer les statistiques
  const stats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Transactions du mois
    const monthTransactions = transactions.filter((t: any) => {
      const date = new Date(t.createdAt || t.date || t.transactionDate);
      return date >= startOfMonth;
    });

    // Transactions du mois dernier
    const lastMonthTransactions = transactions.filter((t: any) => {
      const date = new Date(t.createdAt || t.date || t.transactionDate);
      return date >= startOfLastMonth && date <= endOfLastMonth;
    });

    // Revenus totaux
    const monthRevenue = monthTransactions.reduce((sum: number, t: any) => sum + (t.amountGross || t.amount || 0), 0);
    const lastMonthRevenue = lastMonthTransactions.reduce((sum: number, t: any) => sum + (t.amountGross || t.amount || 0), 0);
    const revenueChange = lastMonthRevenue > 0
      ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0;

    // Clients uniques
    const uniqueClients = new Set(
      monthTransactions.map((t: any) => {
        const customer = t.customer || t.client || {};
        return customer.id || customer.userId || `${customer.firstName || ''}_${customer.lastName || ''}`;
      }).filter(Boolean)
    ).size;

    const lastMonthUniqueClients = new Set(
      lastMonthTransactions.map((t: any) => {
        const customer = t.customer || t.client || {};
        return customer.id || customer.userId || `${customer.firstName || ''}_${customer.lastName || ''}`;
      }).filter(Boolean)
    ).size;

    const clientsChange = lastMonthUniqueClients > 0
      ? Math.round(((uniqueClients - lastMonthUniqueClients) / lastMonthUniqueClients) * 100)
      : 0;

    // Panier moyen
    const averageBasket = monthTransactions.length > 0 ? monthRevenue / monthTransactions.length : 0;
    const lastMonthAverageBasket = lastMonthTransactions.length > 0 ? lastMonthRevenue / lastMonthTransactions.length : 0;
    const basketChange = lastMonthAverageBasket > 0
      ? Math.round(((averageBasket - lastMonthAverageBasket) / lastMonthAverageBasket) * 100)
      : 0;

    // Taux de retour
    const clientVisitCounts = new Map<string, number>();
    monthTransactions.forEach((t: any) => {
      const customer = t.customer || t.client || {};
      const customerId = customer.id || customer.userId || `${customer.firstName || ''}_${customer.lastName || ''}`;
      if (customerId) {
        clientVisitCounts.set(customerId, (clientVisitCounts.get(customerId) || 0) + 1);
      }
    });
    const returningClients = Array.from(clientVisitCounts.values()).filter(count => count > 1).length;
    const returnRate = uniqueClients > 0 ? (returningClients / uniqueClients) * 100 : 0;

    // Calculer le taux de retour du mois dernier pour la comparaison
    const lastMonthClientVisitCounts = new Map<string, number>();
    lastMonthTransactions.forEach((t: any) => {
      const customer = t.customer || t.client || {};
      const customerId = customer.id || customer.userId || `${customer.firstName || ''}_${customer.lastName || ''}`;
      if (customerId) {
        lastMonthClientVisitCounts.set(customerId, (lastMonthClientVisitCounts.get(customerId) || 0) + 1);
      }
    });
    const lastMonthReturningClients = Array.from(lastMonthClientVisitCounts.values()).filter(count => count > 1).length;
    const lastMonthReturnRate = lastMonthUniqueClients > 0 ? (lastMonthReturningClients / lastMonthUniqueClients) * 100 : 0;
    const returnRateChange = lastMonthReturnRate > 0
      ? Math.round(returnRate - lastMonthReturnRate)
      : 0;

    return {
      monthRevenue,
      revenueChange,
      uniqueClients,
      clientsChange,
      averageBasket,
      basketChange,
      returnRate,
      returnRateChange,
    };
  }, [transactions]);

  // Calculer l'évolution des revenus par mois (12 derniers mois)
  const revenueEvolution = useMemo(() => {
    const evolution: { month: string; revenue: number }[] = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthTransactions = transactions.filter((t: any) => {
        const transactionDate = new Date(t.createdAt || t.date || t.transactionDate);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });
      
      const revenue = monthTransactions.reduce((sum: number, t: any) => sum + (t.amountGross || t.amount || 0), 0);
      
      evolution.push({
        month: date.toLocaleDateString('fr-FR', { month: 'short' }),
        revenue,
      });
    }
    
    return evolution;
  }, [transactions]);

  // Calculer l'activité par heure
  const hourlyActivity = useMemo(() => {
    const activity: { [key: number]: number } = {};
    
    for (let hour = 0; hour < 24; hour++) {
      activity[hour] = 0;
    }

    transactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt || transaction.date || transaction.transactionDate);
      const hour = date.getHours();
      activity[hour] = (activity[hour] || 0) + 1;
    });

    return activity;
  }, [transactions]);

  // Calculer la répartition des abonnements
  const subscriptionDistribution = useMemo(() => {
    const distribution: { [key: string]: number } = {
      'Individuel': 0,
      'Duo': 0,
      'Famille': 0,
      'Entreprise': 0,
    };

    transactions.forEach((t: any) => {
      const subscriptionType = t.subscription?.type || t.subscriptionType || 'Individuel';
      const type = subscriptionType === 'individual' || subscriptionType === 'Individuel' ? 'Individuel' :
                   subscriptionType === 'duo' || subscriptionType === 'Duo' ? 'Duo' :
                   subscriptionType === 'family' || subscriptionType === 'Famille' ? 'Famille' :
                   subscriptionType === 'enterprise' || subscriptionType === 'Entreprise' ? 'Entreprise' : 'Individuel';
      distribution[type] = (distribution[type] || 0) + 1;
    });

    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(distribution).map(([type, count]) => ({
      type,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  }, [transactions]);

  const maxRevenue = Math.max(...revenueEvolution.map(e => e.revenue), 1);
  const maxHourlyActivity = Math.max(...Object.values(hourlyActivity), 1);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Statistiques</Text>
          <Text style={styles.headerSubtitle}>Analysez vos performances et vos revenus</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.periodButton} activeOpacity={0.7}>
            <Text style={styles.periodText}>{selectedPeriod} jours</Text>
            <Ionicons name="chevron-down" size={16} color={Colors.text.light} />
          </TouchableOpacity>
          {onExport && (
            <TouchableOpacity style={styles.exportButton} onPress={onExport} activeOpacity={0.7}>
              <Ionicons name="download-outline" size={20} color={Colors.text.light} />
              <Text style={styles.exportText}>Export</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 4 Cartes KPI en 2x2 */}
      <View style={styles.kpiGrid}>
        {/* Revenus totaux */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel}>Revenus totaux</Text>
            <View style={[styles.changeBadge, stats.revenueChange >= 0 ? styles.changeBadgePositive : styles.changeBadgeNegative]}>
              <Ionicons 
                name={stats.revenueChange >= 0 ? "arrow-up" : "arrow-down"} 
                size={12} 
                color={stats.revenueChange >= 0 ? "#10B981" : "#EF4444"} 
              />
              <Text style={[styles.changeText, { color: stats.revenueChange >= 0 ? "#10B981" : "#EF4444" }]}>
                {Math.abs(stats.revenueChange)}%
              </Text>
            </View>
          </View>
          <Text style={styles.kpiValue}>
            {stats.monthRevenue.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €
          </Text>
          <Text style={styles.kpiSubtext}>ce mois</Text>
        </View>

        {/* Clients uniques */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel}>Clients uniques</Text>
            <View style={[styles.changeBadge, stats.clientsChange >= 0 ? styles.changeBadgePositive : styles.changeBadgeNegative]}>
              <Ionicons 
                name={stats.clientsChange >= 0 ? "arrow-up" : "arrow-down"} 
                size={12} 
                color={stats.clientsChange >= 0 ? "#10B981" : "#EF4444"} 
              />
              <Text style={[styles.changeText, { color: stats.clientsChange >= 0 ? "#10B981" : "#EF4444" }]}>
                {Math.abs(stats.clientsChange)}%
              </Text>
            </View>
          </View>
          <Text style={styles.kpiValue}>{stats.uniqueClients}</Text>
          <Text style={styles.kpiSubtext}>ce mois</Text>
        </View>

        {/* Panier moyen */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel}>Panier moyen</Text>
            <View style={[styles.changeBadge, stats.basketChange >= 0 ? styles.changeBadgePositive : styles.changeBadgeNegative]}>
              <Ionicons 
                name={stats.basketChange >= 0 ? "arrow-up" : "arrow-down"} 
                size={12} 
                color={stats.basketChange >= 0 ? "#10B981" : "#EF4444"} 
              />
              <Text style={[styles.changeText, { color: stats.basketChange >= 0 ? "#10B981" : "#EF4444" }]}>
                {Math.abs(stats.basketChange)}%
              </Text>
            </View>
          </View>
          <Text style={styles.kpiValue}>
            {stats.averageBasket.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €
          </Text>
          <Text style={styles.kpiSubtext}>vs mois dernier</Text>
        </View>

        {/* Taux de retour */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel}>Taux de retour</Text>
            <View style={[styles.changeBadge, stats.returnRateChange >= 0 ? styles.changeBadgePositive : styles.changeBadgeNegative]}>
              <Ionicons 
                name={stats.returnRateChange >= 0 ? "arrow-up" : "arrow-down"} 
                size={12} 
                color={stats.returnRateChange >= 0 ? "#10B981" : "#EF4444"} 
              />
              <Text style={[styles.changeText, { color: stats.returnRateChange >= 0 ? "#10B981" : "#EF4444" }]}>
                {Math.abs(stats.returnRateChange)}%
              </Text>
            </View>
          </View>
          <Text style={styles.kpiValue}>{stats.returnRate.toFixed(1).replace('.', ',')}%</Text>
          <Text style={styles.kpiSubtext}>clients fidèles</Text>
        </View>
      </View>

      {/* Évolution des revenus */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Évolution des revenus</Text>
          <TouchableOpacity style={styles.chartDropdown} activeOpacity={0.7}>
            <Text style={styles.chartDropdownText}>Revenus</Text>
            <Ionicons name="chevron-down" size={16} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.lineChartContainer}>
          {/* Axe Y avec valeurs */}
          <View style={styles.lineChartYAxis}>
            {(() => {
              const maxValue = Math.max(...revenueEvolution.map(e => e.revenue), 1000);
              const step = Math.ceil(maxValue / 4);
              return [0, step, step * 2, step * 3, step * 4].map((value) => (
                <Text key={value} style={styles.lineChartYLabel}>
                  {value.toLocaleString('fr-FR')}
                </Text>
              ));
            })()}
          </View>
          <View style={styles.lineChartContent}>
            <View style={styles.lineChart}>
              {revenueEvolution.map((point, index) => {
                const height = maxRevenue > 0 ? (point.revenue / maxRevenue) * 100 : 0;
                return (
                  <View key={index} style={styles.lineChartPoint}>
                    <View style={[styles.lineChartDot, { bottom: `${height}%` }]} />
                  </View>
                );
              })}
            </View>
            {/* Ligne de connexion */}
            <View style={styles.lineChartConnector}>
              {revenueEvolution.map((point, index) => {
                if (index === revenueEvolution.length - 1) return null;
                const height = maxRevenue > 0 ? (point.revenue / maxRevenue) * 100 : 0;
                const nextPoint = revenueEvolution[index + 1];
                const nextHeight = nextPoint && maxRevenue > 0 ? (nextPoint.revenue / maxRevenue) * 100 : 0;
                const segmentWidth = 100 / revenueEvolution.length;
                const segmentHeight = Math.abs(nextHeight - height);
                const angle = Math.atan2(nextHeight - height, segmentWidth) * (180 / Math.PI);
                
                return (
                  <View
                    key={`segment-${index}`}
                    style={[
                      styles.lineChartSegment,
                      {
                        left: `${(index + 0.5) * segmentWidth}%`,
                        bottom: `${Math.min(height, nextHeight)}%`,
                        width: `${Math.sqrt(segmentWidth * segmentWidth + segmentHeight * segmentHeight)}%`,
                        height: 2,
                        transform: [{ rotate: `${angle}deg` }],
                        transformOrigin: 'left center',
                      },
                    ]}
                  />
                );
              })}
            </View>
            {/* Axe X avec labels */}
            <View style={styles.lineChartXAxis}>
              {revenueEvolution.map((point, index) => (
                <Text key={index} style={styles.lineChartLabel}>
                  {point.month}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Activité par heure */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Activité par heure</Text>
        <View style={styles.barChartContainer}>
          {Array.from({ length: 24 }, (_, hour) => {
            const activity = hourlyActivity[hour] || 0;
            const height = maxHourlyActivity > 0 ? (activity / maxHourlyActivity) * 100 : 0;
            return (
              <View key={hour} style={styles.barChartBarWrapper}>
                <LinearGradient
                  colors={['#F97316', '#EF4444']}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                  style={[styles.barChartBar, { height: `${height}%` }]}
                />
                <Text style={styles.barChartLabel}>{hour}h</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Répartition des abonnements */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Répartition des abonnements</Text>
          <TouchableOpacity style={styles.helpButton} activeOpacity={0.7}>
            <Ionicons name="help-circle-outline" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.donutChartContainer}>
          {/* Donut Chart visuel simplifié */}
          <View style={styles.donutChartVisual}>
            <View style={styles.donutChartRing}>
              {subscriptionDistribution.map((item, index) => {
                const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F97316'];
                const color = colors[index % colors.length];
                const total = subscriptionDistribution.reduce((sum, i) => sum + i.percentage, 0);
                const width = total > 0 ? (item.percentage / total) * 100 : 0;
                
                return (
                  <View
                    key={item.type}
                    style={[
                      styles.donutSegment,
                      {
                        backgroundColor: color,
                        width: `${width}%`,
                      },
                    ]}
                  />
                );
              })}
            </View>
            <View style={styles.donutChartCenter}>
              <Text style={styles.donutChartCenterText}>Total</Text>
            </View>
          </View>
          {/* Légende */}
          <View style={styles.donutChart}>
            {subscriptionDistribution.map((item, index) => {
              const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F97316'];
              const color = colors[index % colors.length];
              return (
                <View key={item.type} style={styles.donutLegendItem}>
                  <View style={[styles.donutLegendColor, { backgroundColor: color }]} />
                  <Text style={styles.donutLegendText}>{item.type}</Text>
                  <Text style={styles.donutLegendPercentage}>{item.percentage}%</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  } as ViewStyle,
  headerLeft: {
    flex: 1,
  } as ViewStyle,
  headerTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '900',
    color: Colors.text.light,
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
  } as TextStyle,
  headerSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '500',
  } as TextStyle,
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  } as ViewStyle,
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  } as ViewStyle,
  periodText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.light,
  } as TextStyle,
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(139, 47, 63, 0.2)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(139, 47, 63, 0.3)',
  } as ViewStyle,
  exportText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.light,
  } as TextStyle,
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  } as ViewStyle,
  kpiCard: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    minHeight: 140,
  } as ViewStyle,
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    minHeight: 32,
  } as ViewStyle,
  kpiLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.xs,
  } as TextStyle,
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    minWidth: 50,
    justifyContent: 'flex-end',
  } as ViewStyle,
  changeBadgePositive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  } as ViewStyle,
  changeBadgeNegative: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  } as ViewStyle,
  changeText: {
    fontSize: 11,
    fontWeight: '800',
  } as TextStyle,
  kpiValue: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '900',
    color: Colors.text.light,
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
    lineHeight: Typography.sizes['2xl'] * 1.1,
  } as TextStyle,
  kpiSubtext: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: '500',
    marginTop: 2,
  } as TextStyle,
  chartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  } as ViewStyle,
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  } as ViewStyle,
  chartTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '900',
    color: Colors.text.light,
    letterSpacing: -0.3,
  } as TextStyle,
  chartDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.sm,
  } as ViewStyle,
  chartDropdownText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '600',
  } as TextStyle,
  helpButton: {
    padding: Spacing.xs,
  } as ViewStyle,
  lineChartContainer: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    height: 280,
    paddingTop: Spacing.md,
  } as ViewStyle,
  lineChartYAxis: {
    width: 45,
    justifyContent: 'space-between',
    paddingRight: Spacing.sm,
    paddingBottom: 30,
    paddingTop: Spacing.xs,
  } as ViewStyle,
  lineChartYLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: '700',
    textAlign: 'right',
  } as TextStyle,
  lineChartContent: {
    flex: 1,
    position: 'relative',
  } as ViewStyle,
  lineChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    paddingHorizontal: Spacing.md,
    paddingBottom: 30,
    paddingTop: Spacing.xs,
  } as ViewStyle,
  lineChartPoint: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    position: 'relative',
  } as ViewStyle,
  lineChartDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: '#8B2F3F',
    borderRadius: 5,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    zIndex: 10,
    shadowColor: '#8B2F3F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  } as ViewStyle,
  lineChartConnector: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.md,
    right: Spacing.md,
    bottom: 30,
    pointerEvents: 'none',
  } as ViewStyle,
  lineChartSegment: {
    position: 'absolute',
    backgroundColor: '#8B2F3F',
    height: 3,
    borderRadius: 1.5,
  } as ViewStyle,
  lineChartXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  lineChartLabel: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: '700',
    textAlign: 'center',
  } as TextStyle,
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 220,
    paddingHorizontal: Spacing.xs,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 25,
  } as ViewStyle,
  barChartBarWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    maxWidth: 12,
  } as ViewStyle,
  barChartBar: {
    width: '100%',
    borderRadius: BorderRadius.sm,
    minHeight: 4,
    marginBottom: Spacing.xs,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  } as ViewStyle,
  barChartLabel: {
    fontSize: 9,
    color: Colors.text.secondary,
    fontWeight: '700',
    marginTop: 4,
  } as TextStyle,
  donutChartContainer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  } as ViewStyle,
  donutChartVisual: {
    width: 220,
    height: 220,
    borderRadius: 110,
    position: 'relative',
    marginBottom: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  donutChartRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 50,
    borderColor: 'transparent',
  } as ViewStyle,
  donutSegment: {
    height: '100%',
  } as ViewStyle,
  donutChartCenter: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  donutChartCenterText: {
    fontSize: Typography.sizes.base,
    fontWeight: '800',
    color: Colors.text.light,
  } as TextStyle,
  donutChart: {
    gap: Spacing.lg,
    width: '100%',
    paddingHorizontal: Spacing.md,
  } as ViewStyle,
  donutLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  } as ViewStyle,
  donutLegendColor: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  donutLegendText: {
    flex: 1,
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.light,
  } as TextStyle,
  donutLegendPercentage: {
    fontSize: Typography.sizes.base,
    fontWeight: '800',
    color: Colors.text.secondary,
    minWidth: 50,
    textAlign: 'right',
  } as TextStyle,
});
