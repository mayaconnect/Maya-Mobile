import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import React from 'react';
// import React, { useMemo, useState } from 'react';
import {
  // Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle
} from 'react-native';
// import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';

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
  // TODO: Fonctionnalité à venir - Code commenté pour la présentation
  // const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30' | '90' | '365'>('30');

  // Calculer les statistiques
  /* const stats = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        monthRevenue: 0,
        revenueChange: 0,
        uniqueClients: 0,
        clientsChange: 0,
        averageBasket: 0,
        basketChange: 0,
        returnRate: 0,
        returnRateChange: 0,
      };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    startOfLastMonth.setHours(0, 0, 0, 0);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    endOfLastMonth.setHours(23, 59, 59, 999);

    // Helper pour parser la date d'une transaction
    const parseTransactionDate = (t: any): Date | null => {
      const dateStr = t.createdAt || t.date || t.transactionDate || t.timestamp;
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    };

    // Helper pour obtenir le montant d'une transaction (prix net après remise)
    const getTransactionAmount = (t: any): number => {
      return t.amountNet || t.amountAfterDiscount || t.amountGross || t.amount || t.totalAmount || 0;
    };

    // Helper pour obtenir l'ID du client
    const getClientId = (t: any): string | null => {
      // Essayer d'abord avec customer/client object
      const customer = t.customer || t.client || {};
      if (customer.id) return String(customer.id);
      if (customer.userId) return String(customer.userId);
      
      // Essayer avec les propriétés directes
      if (t.userId) return String(t.userId);
      if (t.clientId) return String(t.clientId);
      
      // Essayer avec le nom
      if (customer.firstName || customer.lastName) {
        return `${customer.firstName || ''}_${customer.lastName || ''}`.trim();
      }
      if (t.clientName) return t.clientName;
      
      return null;
    };

    // Transactions du mois
    const monthTransactions = transactions.filter((t: any) => {
      const date = parseTransactionDate(t);
      if (!date) return false;
      return date >= startOfMonth;
    });

    // Transactions du mois dernier
    const lastMonthTransactions = transactions.filter((t: any) => {
      const date = parseTransactionDate(t);
      if (!date) return false;
      return date >= startOfLastMonth && date <= endOfLastMonth;
    });

    // Revenus totaux
    const monthRevenue = monthTransactions.reduce((sum: number, t: any) => {
      return sum + getTransactionAmount(t);
    }, 0);
    
    const lastMonthRevenue = lastMonthTransactions.reduce((sum: number, t: any) => {
      return sum + getTransactionAmount(t);
    }, 0);
    
    const revenueChange = lastMonthRevenue > 0
      ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : (monthRevenue > 0 ? 100 : 0);

    // Clients uniques
    const uniqueClientsSet = new Set<string>();
    monthTransactions.forEach((t: any) => {
      const clientId = getClientId(t);
      if (clientId) uniqueClientsSet.add(clientId);
    });
    const uniqueClients = uniqueClientsSet.size;

    const lastMonthUniqueClientsSet = new Set<string>();
    lastMonthTransactions.forEach((t: any) => {
      const clientId = getClientId(t);
      if (clientId) lastMonthUniqueClientsSet.add(clientId);
    });
    const lastMonthUniqueClients = lastMonthUniqueClientsSet.size;

    const clientsChange = lastMonthUniqueClients > 0
      ? Math.round(((uniqueClients - lastMonthUniqueClients) / lastMonthUniqueClients) * 100)
      : (uniqueClients > 0 ? 100 : 0);

    // Panier moyen
    const averageBasket = monthTransactions.length > 0 ? monthRevenue / monthTransactions.length : 0;
    const lastMonthAverageBasket = lastMonthTransactions.length > 0 ? lastMonthRevenue / lastMonthTransactions.length : 0;
    const basketChange = lastMonthAverageBasket > 0
      ? Math.round(((averageBasket - lastMonthAverageBasket) / lastMonthAverageBasket) * 100)
      : (averageBasket > 0 ? 100 : 0);

    // Taux de retour
    const clientVisitCounts = new Map<string, number>();
    monthTransactions.forEach((t: any) => {
      const clientId = getClientId(t);
      if (clientId) {
        clientVisitCounts.set(clientId, (clientVisitCounts.get(clientId) || 0) + 1);
      }
    });
    const returningClients = Array.from(clientVisitCounts.values()).filter(count => count > 1).length;
    const returnRate = uniqueClients > 0 ? (returningClients / uniqueClients) * 100 : 0;

    // Calculer le taux de retour du mois dernier pour la comparaison
    const lastMonthClientVisitCounts = new Map<string, number>();
    lastMonthTransactions.forEach((t: any) => {
      const clientId = getClientId(t);
      if (clientId) {
        lastMonthClientVisitCounts.set(clientId, (lastMonthClientVisitCounts.get(clientId) || 0) + 1);
      }
    });
    const lastMonthReturningClients = Array.from(lastMonthClientVisitCounts.values()).filter(count => count > 1).length;
    const lastMonthReturnRate = lastMonthUniqueClients > 0 ? (lastMonthReturningClients / lastMonthUniqueClients) * 100 : 0;
    const returnRateChange = Math.round(returnRate - lastMonthReturnRate);

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
  }, [transactions]); */

  // Calculer l'évolution des revenus par mois (3 derniers mois)
  /* const revenueEvolution = useMemo(() => {
    const evolution: { month: string; revenue: number }[] = [];
    const now = new Date();
    
    const getTransactionAmount = (t: any): number => {
      return t.amountNet || t.amountAfterDiscount || t.amountGross || t.amount || t.totalAmount || 0;
    };

    const parseTransactionDate = (t: any): Date | null => {
      const dateStr = t.createdAt || t.date || t.transactionDate || t.timestamp;
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    };
    
    // Afficher seulement les 3 derniers mois
    for (let i = 2; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      
      const monthTransactions = transactions.filter((t: any) => {
        const transactionDate = parseTransactionDate(t);
        if (!transactionDate) return false;
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });
      
      const revenue = monthTransactions.reduce((sum: number, t: any) => {
        return sum + getTransactionAmount(t);
      }, 0);
      
      evolution.push({
        month: date.toLocaleDateString('fr-FR', { month: 'short' }),
        revenue,
      });
    }
    
    return evolution;
  }, [transactions]); */

  // Calculer l'activité par heure
  /* const hourlyActivity = useMemo(() => {
    const activity: { [key: number]: number } = {};
    
    for (let hour = 0; hour < 24; hour++) {
      activity[hour] = 0;
    }

    const parseTransactionDate = (t: any): Date | null => {
      const dateStr = t.createdAt || t.date || t.transactionDate || t.timestamp;
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    };

    transactions.forEach((transaction) => {
      const date = parseTransactionDate(transaction);
      if (date) {
        const hour = date.getHours();
        activity[hour] = (activity[hour] || 0) + 1;
      }
    });

    return activity;
  }, [transactions]); */

  // Calculer la répartition des abonnements
  /* const subscriptionDistribution = useMemo(() => {
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
  }, [transactions]); */

  /* const maxRevenue = Math.max(...revenueEvolution.map(e => e.revenue), 1);
  const maxHourlyActivity = Math.max(...Object.values(hourlyActivity), 1);

  // Préparer les données pour les graphiques
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - (Spacing.lg * 2) - (Spacing.xl * 2);

  // Données pour le graphique linéaire (évolution des revenus)
  const lineChartData = {
    labels: revenueEvolution.map(e => e.month),
    datasets: [
      {
        data: revenueEvolution.map(e => e.revenue),
        color: (opacity = 1) => `rgba(139, 47, 63, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  // Données pour le graphique en barres (activité par heure) - toutes les heures séparées
  const barChartData = useMemo(() => {
    const hourlyData: number[] = [];
    const hourlyLabels: string[] = [];
    
    // Afficher toutes les 24 heures séparément pour plus de précision
    for (let i = 0; i < 24; i++) {
      hourlyData.push(Math.round(hourlyActivity[i] || 0));
      hourlyLabels.push(`${i}h`);
    }
    
    return {
      labels: hourlyLabels,
      datasets: [
        {
          data: hourlyData,
        },
      ],
    };
  }, [hourlyActivity]);

  // Calculer le nombre de segments en fonction de la valeur max
  const maxBarValue = useMemo(() => {
    if (!barChartData.datasets[0].data.length) return 1;
    return Math.max(...barChartData.datasets[0].data, 1);
  }, [barChartData]);

  const barSegments = useMemo(() => {
    if (maxBarValue === 0) return 3;
    if (maxBarValue <= 3) return maxBarValue;
    return 3;
  }, [maxBarValue]);

  // Données pour le graphique en donut (répartition des abonnements)
  const pieChartData = subscriptionDistribution
    .filter(item => item.count > 0)
    .map((item, index) => {
      const colors = ['#8B2F3F', '#A03D52', '#6B1F2F', '#C04D62'];
      return {
        name: item.type,
        population: item.count,
        color: colors[index % colors.length],
        legendFontColor: Colors.text.light,
        legendFontSize: Typography.sizes.sm,
      };
    });

  // Configuration des graphiques
  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(139, 47, 63, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.8})`,
    formatYLabel: (value: string) => {
      const num = parseFloat(value);
      const rounded = Math.round(num);
      return rounded.toString();
    },
    style: {
      borderRadius: BorderRadius.xl,
    },
    propsForDots: {
      r: '7',
      strokeWidth: '3',
      stroke: '#FFFFFF',
      fill: '#8B2F3F',
    },
    propsForBackgroundLines: {
      strokeDasharray: '5,5',
      stroke: 'rgba(255, 255, 255, 0.15)',
      strokeWidth: 1.5,
    },
    barPercentage: 0.65,
    fillShadowGradient: '#8B2F3F',
    fillShadowGradientOpacity: 0.3,
  }; */

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.comingSoonContainer}>
        <Text style={styles.title}>Fonctionnalité à venir</Text>
        <Text style={styles.subtitle}>
          Les statistiques détaillées seront bientôt disponibles.
        </Text>
        <Text style={styles.description}>
          Nous travaillons actuellement sur cette fonctionnalité pour vous offrir des analyses complètes de vos performances.
        </Text>
      </View>

      {/* Code commenté - À décommenter quand la fonctionnalité sera prête
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel} numberOfLines={2}>Revenus totaux</Text>
          </View>
          <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit>
            {stats.monthRevenue.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €
          </Text>
          <Text style={styles.kpiSubtext} numberOfLines={1}>ce mois</Text>
        </View>
        ...
      </View>
      */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  } as ViewStyle,
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xl,
  } as ViewStyle,
  comingSoonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing['3xl'],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    ...Shadows.lg,
    width: '100%',
    alignSelf: 'stretch',
  } as ViewStyle,
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '900',
    color: Colors.text.light,
    marginBottom: Spacing.md,
    textAlign: 'center',
    letterSpacing: -0.5,
  } as TextStyle,
  subtitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  } as TextStyle,
  description: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  } as TextStyle,
  // Styles pour le code commenté (à garder pour plus tard)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  } as ViewStyle,
  headerLeft: {
    flex: 1,
    minWidth: 0,
  } as ViewStyle,
  headerTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '900',
    color: Colors.text.light,
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
    flexShrink: 1,
  } as TextStyle,
  headerSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '500',
    flexShrink: 1,
  } as TextStyle,
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 0,
  } as ViewStyle,
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    ...Shadows.sm,
    minWidth: 80,
  } as ViewStyle,
  periodText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.light,
    flexShrink: 1,
  } as TextStyle,
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(139, 47, 63, 0.2)',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(139, 47, 63, 0.3)',
    ...Shadows.sm,
  } as ViewStyle,
  exportText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.light,
    flexShrink: 1,
  } as TextStyle,
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  } as ViewStyle,
  kpiCard: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    minHeight: 150,
    ...Shadows.sm,
  } as ViewStyle,
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    minHeight: 40,
    gap: Spacing.xs,
  } as ViewStyle,
  kpiLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.xs,
    lineHeight: 18,
    flexShrink: 1,
  } as TextStyle,
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    minWidth: 50,
    maxWidth: 60,
    justifyContent: 'flex-end',
    borderWidth: 1,
    flexShrink: 0,
  } as ViewStyle,
  changeBadgePositive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  } as ViewStyle,
  changeBadgeNegative: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
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
    minHeight: 32,
  } as TextStyle,
  kpiSubtext: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: '500',
    marginTop: Spacing.xs,
    lineHeight: 16,
  } as TextStyle,
  chartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    width: '100%',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    ...Shadows.sm,
  } as ViewStyle,
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  } as ViewStyle,
  chartTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '800',
    color: Colors.text.light,
    letterSpacing: -0.3,
  } as TextStyle,
  chartDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  } as ViewStyle,
  chartDropdownText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '600',
  } as TextStyle,
  helpButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  } as ViewStyle,
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  } as ViewStyle,
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  } as ViewStyle,
  chartBackground: {
    backgroundColor: 'rgba(26, 10, 14, 0.4)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Shadows.sm,
  } as ViewStyle,
  chart: {
    marginVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
  } as ViewStyle,
  barChartScrollView: {
    marginTop: Spacing.md,
  } as ViewStyle,
  barChartScrollContent: {
    paddingRight: Spacing.lg,
  } as ViewStyle,
  pieChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  } as ViewStyle,
  emptyChartContainer: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  emptyChartText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  lineChartContainer: {
    flexDirection: 'row',
    marginTop: Spacing.md,
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
    width: 12,
    height: 12,
    backgroundColor: '#8B2F3F',
    borderRadius: 6,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    zIndex: 10,
    shadowColor: '#8B2F3F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
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
    height: 2.5,
    borderRadius: 1.25,
    shadowColor: '#8B2F3F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  } as ViewStyle,
  lineChartXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
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
    marginTop: Spacing.md,
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
    shadowColor: '#8B2F3F',
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
    marginTop: Spacing.md,
    alignItems: 'center',
  } as ViewStyle,
  donutChartVisual: {
    width: 220,
    height: 220,
    borderRadius: 110,
    position: 'relative',
    marginBottom: Spacing.lg,
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
    backgroundColor: 'rgba(26, 10, 14, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  } as ViewStyle,
  donutChartCenterText: {
    fontSize: Typography.sizes.base,
    fontWeight: '800',
    color: Colors.text.light,
  } as TextStyle,
  pieChartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    width: '100%',
    alignSelf: 'center',
  } as ViewStyle,
  donutChart: {
    gap: Spacing.md,
    width: '100%',
    paddingHorizontal: Spacing.md,
  } as ViewStyle,
  donutLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  donutLegendColor: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  donutLegendContent: {
    flex: 1,
  } as ViewStyle,
  donutLegendText: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: 2,
  } as TextStyle,
  donutLegendCount: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: '500',
  } as TextStyle,
  donutLegendPercentage: {
    fontSize: Typography.sizes.lg,
    fontWeight: '900',
    color: Colors.text.light,
  } as TextStyle,
});
