import { NavigationTransition } from '@/components/common/navigation-transition';
import { NeoCard } from '@/components/neo/NeoCard';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { useAuth } from '@/hooks/use-auth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TimelineEntry = {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  occurredAt: string;
  discountRate?: number;
  tag?: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    color: string;
    background: string;
    border: string;
  };
};

const customerHistory: TimelineEntry[] = [
  {
    id: 'cust-1',
    title: 'Café des Arts',
    subtitle: 'Menu déjeuner',
    amount: 12.5,
    discountRate: 0.1,
    occurredAt: '2025-11-13T10:30:00Z',
    tag: {
      icon: 'sparkles-outline',
      label: '-10% appliqué',
      color: Colors.secondary[300],
      background: 'rgba(39,239,161,0.16)',
      border: 'rgba(39,239,161,0.35)',
    },
  },
  {
    id: 'cust-2',
    title: 'Bistro Le Marché',
    subtitle: 'Formule soir',
    amount: 28.3,
    discountRate: 0.15,
    occurredAt: '2025-11-12T18:45:00Z',
    tag: {
      icon: 'sparkles-outline',
      label: '-15% appliqué',
      color: Colors.secondary[300],
      background: 'rgba(39,239,161,0.16)',
      border: 'rgba(39,239,161,0.35)',
    },
  },
  {
    id: 'cust-3',
    title: 'Boutique Mode',
    subtitle: 'Sélection kids',
    amount: 54.0,
    discountRate: 0.2,
    occurredAt: '2025-11-11T16:05:00Z',
    tag: {
      icon: 'sparkles-outline',
      label: '-20% appliqué',
      color: Colors.secondary[300],
      background: 'rgba(39,239,161,0.16)',
      border: 'rgba(39,239,161,0.35)',
    },
  },
  {
    id: 'cust-4',
    title: 'Studio Fit',
    subtitle: 'Session bien-être',
    amount: 22.9,
    discountRate: 0.12,
    occurredAt: '2025-11-09T09:20:00Z',
    tag: {
      icon: 'sparkles-outline',
      label: '-12% appliqué',
      color: Colors.secondary[300],
      background: 'rgba(39,239,161,0.16)',
      border: 'rgba(39,239,161,0.35)',
    },
  },
];

const partnerVisits: TimelineEntry[] = [
  {
    id: 'visit-1',
    title: 'Marie Dupont',
    subtitle: 'Visite "Formule déjeuner"',
    amount: 18.5,
    occurredAt: '2025-11-13T10:30:00Z',
    tag: {
      icon: 'checkmark-circle-outline',
      label: 'Visite validée',
      color: Colors.accent.cyan,
      background: 'rgba(45,217,255,0.16)',
      border: 'rgba(45,217,255,0.35)',
    },
  },
  {
    id: 'visit-2',
    title: 'Jean Martin',
    subtitle: 'Abonnement mensuel',
    amount: 29.9,
    occurredAt: '2025-11-12T18:45:00Z',
    tag: {
      icon: 'checkmark-circle-outline',
      label: 'Abonnement confirmé',
      color: Colors.accent.cyan,
      background: 'rgba(45,217,255,0.16)',
      border: 'rgba(45,217,255,0.35)',
    },
  },
  {
    id: 'visit-3',
    title: 'Sophie Bernard',
    subtitle: 'Atelier découverte',
    amount: 32.0,
    occurredAt: '2025-11-11T16:05:00Z',
    tag: {
      icon: 'checkmark-circle-outline',
      label: 'QR validé',
      color: Colors.accent.cyan,
      background: 'rgba(45,217,255,0.16)',
      border: 'rgba(45,217,255,0.35)',
    },
  },
  {
    id: 'visit-4',
    title: 'Pierre Leroy',
    subtitle: 'Formule afterwork',
    amount: 21.4,
    occurredAt: '2025-11-10T08:40:00Z',
    tag: {
      icon: 'checkmark-circle-outline',
      label: 'Visite validée',
      color: Colors.accent.cyan,
      background: 'rgba(45,217,255,0.16)',
      border: 'rgba(45,217,255,0.35)',
    },
  },
];

export default function HistoryScreen() {
  const { user } = useAuth();
  const isPartner =
    user?.email?.toLowerCase().includes('partner') ||
    user?.email?.toLowerCase().includes('partenaire') ||
    (user as any)?.role === 'partner' ||
    (user as any)?.isPartner === true;

  const entries = useMemo(() => (isPartner ? partnerVisits : customerHistory), [isPartner]);

  const totalAmount = useMemo(() => entries.reduce((sum, entry) => sum + entry.amount, 0), [entries]);

  const totalSavings = useMemo(
    () => entries.reduce((sum, entry) => sum + (entry.discountRate ?? 0) * entry.amount, 0),
    [entries],
  );

  const bestDiscount = useMemo(() => {
    const rates = entries.map((entry) => entry.discountRate ?? 0).filter((rate) => rate > 0);
    if (!rates.length) return 0;
    return Math.max(...rates);
  }, [entries]);

  const uniqueCustomers = useMemo(() => new Set(entries.map((entry) => entry.title)).size, [entries]);

  const formatCurrency = (value: number) =>
    value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

  const formatDiscount = (rate: number) => `${Math.round(rate * 100)}%`;

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  const summaryItems = isPartner
    ? [
        { label: 'Visites validées', value: entries.length.toString() },
        { label: 'Clients uniques', value: uniqueCustomers.toString() },
        { label: 'Chiffre d’affaires', value: formatCurrency(totalAmount) },
      ]
    : [
        { label: 'Dépenses cumulées', value: formatCurrency(totalAmount) },
        { label: 'Économies cumulées', value: formatCurrency(totalSavings) },
        { label: 'Meilleure remise', value: bestDiscount > 0 ? formatDiscount(bestDiscount) : '—' },
      ];

  const heroTitle = isPartner ? 'Historique des visites' : 'Historique des achats';
  const heroSubtitle = isPartner
    ? `${entries.length} validations enregistrées cette semaine`
    : `${entries.length} sorties partagées récemment`;

  const heroLeftValue = isPartner ? entries.length.toString() : formatCurrency(totalAmount);
  const heroLeftLabel = isPartner ? 'Visites validées' : 'Total dépensé';
  const heroRightValue = isPartner ? uniqueCustomers.toString() : formatCurrency(totalSavings);
  const heroRightLabel = isPartner ? 'Clients uniques' : 'Économies réalisées';

  return (
    <NavigationTransition>
      <View style={styles.screen}>
        <LinearGradient
          colors={['#450A1D', '#120A18']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <StatusBar barStyle="light-content" />
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <NeoCard gradient={['#4C0F22', '#1A112A']} style={styles.heroCard}>
              <Text style={styles.heroTitle}>{heroTitle}</Text>
              <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>
              <View style={styles.heroStatsRow}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{heroLeftValue}</Text>
                  <Text style={styles.heroStatLabel}>{heroLeftLabel}</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{heroRightValue}</Text>
                  <Text style={styles.heroStatLabel}>{heroRightLabel}</Text>
                </View>
              </View>
            </NeoCard>

            <NeoCard variant="glass" style={styles.summaryCard}>
              <Text style={styles.sectionTitle}>Synthèse</Text>
              <View style={styles.summaryGrid}>
                {summaryItems.map((item, index) => (
                  <React.Fragment key={item.label}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>{item.value}</Text>
                      <Text style={styles.summaryLabel}>{item.label}</Text>
                    </View>
                    {index < summaryItems.length - 1 && <View style={styles.summaryDivider} />}
                  </React.Fragment>
                ))}
              </View>
            </NeoCard>

            <NeoCard variant="glass" style={styles.timelineCard}>
              <View style={styles.timelineHeader}>
                <Text style={styles.sectionTitle}>Historique récent</Text>
                <TouchableOpacity activeOpacity={0.7} style={styles.filterChip}>
                  <Ionicons name="funnel-outline" size={14} color={Colors.text.light} />
                  <Text style={styles.filterChipText}>Filtrer</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.timelineList}>
                {entries.map((entry, index) => {
                  const isLast = index === entries.length - 1;
                  return (
                    <View key={entry.id} style={styles.timelineItem}>
                      <View style={styles.timelineMarker}>
                        {!isLast && <View style={styles.timelineConnector} />}
                        <View style={styles.timelineDot} />
                      </View>
                      <View style={styles.timelineContent}>
                        <View style={styles.timelineRow}>
                          <Text style={styles.entryTitle}>{entry.title}</Text>
                          <Text style={styles.amount}>{formatCurrency(entry.amount)}</Text>
                        </View>
                        <Text style={styles.entrySubtitle}>{entry.subtitle}</Text>
                        <View style={styles.timelineMeta}>
                          <View style={styles.metaChip}>
                            <Ionicons name="time-outline" size={12} color={Colors.text.muted} />
                            <Text style={styles.date}>{formatDateTime(entry.occurredAt)}</Text>
                          </View>
                          {entry.tag ? (
                            <View style={[styles.tagChip, { backgroundColor: entry.tag.background, borderColor: entry.tag.border }]}>
                              <Ionicons name={entry.tag.icon} size={12} color={entry.tag.color} />
                              <Text style={[styles.tagLabel, { color: entry.tag.color }]}>{entry.tag.label}</Text>
                            </View>
                          ) : entry.discountRate ? (
                            <View style={styles.discountChip}>
                              <Ionicons name="sparkles-outline" size={12} color={Colors.secondary[300]} />
                              <Text style={styles.discountText}>-{formatDiscount(entry.discountRate)}</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  );
                })}
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing['2xl'],
    gap: Spacing.lg,
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
  heroStatsRow: {
    position: 'relative',
    top: 20,
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
  heroStat: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs / 2,
  } as ViewStyle,
  heroStatValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
  heroStatLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  } as TextStyle,
  heroDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.12)',
  } as ViewStyle,
  summaryCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
  summaryGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  } as ViewStyle,
  summaryItem: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs / 2,
  } as ViewStyle,
  summaryValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
  summaryLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  } as TextStyle,
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  } as ViewStyle,
  timelineCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
  } as ViewStyle,
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(243, 243, 243, 0.08)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(245, 239, 239, 0.12)',
  } as ViewStyle,
  filterChipText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.light,
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  timelineList: {
    gap: Spacing.lg,
  } as ViewStyle,
  timelineItem: {
    flexDirection: 'row',
    gap: Spacing.md,
    position: 'relative',
  } as ViewStyle,
  timelineMarker: {
    width: 20,
    alignItems: 'center',
    position: 'relative',
  } as ViewStyle,
  timelineConnector: {
    position: 'absolute',
    top: 20,
    bottom: -Spacing.md,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  } as ViewStyle,
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accent.rose,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  } as ViewStyle,
  timelineContent: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  } as ViewStyle,
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  partnerName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium as any,
    color: Colors.text.light,
  } as TextStyle,
  amount: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.secondary[200],
  } as TextStyle,
  entryTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium as any,
    color: Colors.text.light,
  } as TextStyle,
  entrySubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
  } as TextStyle,
  timelineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  } as ViewStyle,
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
  } as ViewStyle,
  date: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
  } as TextStyle,
  discountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
    backgroundColor: 'rgba(39,239,161,0.16)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 1.2,
    borderWidth: 1,
    borderColor: 'rgba(39,239,161,0.35)',
  } as ViewStyle,
  discountText: {
    fontSize: Typography.sizes.xs,
    color: Colors.secondary[300],
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
});