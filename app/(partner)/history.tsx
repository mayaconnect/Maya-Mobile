/**
 * Maya Connect V2 — Partner Transaction History Screen
 *
 * Paginated list of transactions for the current partner / store operator.
 */
import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { transactionsApi } from '../../src/api/transactions.api';
import { partnerColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import { formatPrice, formatDateTime, formatPercent } from '../../src/utils/format';
import {
  MCard,
  MBadge,
  LoadingSpinner,
  EmptyState,
  ErrorState,
} from '../../src/components/ui';
import { usePartnerStore } from '../../src/stores/partner.store';

const PAGE_SIZE = 15;

export default function PartnerHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const activeStore = usePartnerStore((s) => s.activeStore);
  const partner = usePartnerStore((s) => s.partner);
  const storeId = activeStore?.storeId ?? undefined;
  const partnerId = partner?.id ?? undefined;

  const txQ = useInfiniteQuery({
    queryKey: ['partnerTxHistory', partnerId, storeId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      transactionsApi.getByPartner(partnerId!, {
        storeId,
        page: pageParam,
        pageSize: PAGE_SIZE,
      }),
    enabled: !!partnerId,
    getNextPageParam: (lastPage) => {
      const d = lastPage.data;
      return d.page < d.totalPages ? d.page + 1 : undefined;
    },
  });

  const items = txQ.data?.pages.flatMap((p) => p.data.items ?? []) ?? [];
  const totalCount = txQ.data?.pages[0]?.data.totalCount ?? 0;

  /* ---- Summary stats ---- */
  const totalGross = items.reduce((a: number, t: any) => a + (t.amountGross ?? 0), 0);
  const totalDiscount = items.reduce((a: number, t: any) => a + (t.discountAmount ?? 0), 0);

  const renderTx = useCallback(
    ({ item }: any) => (
      <MCard style={styles.txCard} elevation="sm">
        <View style={styles.txRow}>
          <View style={styles.txIcon}>
            <Ionicons
              name="receipt-outline"
              size={wp(18)}
              color={colors.violet[500]}
            />
          </View>

          <View style={styles.txInfo}>
            <Text style={styles.txName} numberOfLines={1}>
              {item.customerName ??
                item.storeName ??
                `Transaction #${item.transactionId?.slice(0, 6) ?? '—'}`}
            </Text>
            <Text style={styles.txDate}>
              {formatDateTime(item.createdAt)}
            </Text>
            <View style={styles.txMeta}>
              {item.personsCount ? (
                <View style={styles.metaItem}>
                  <Ionicons
                    name="people-outline"
                    size={wp(12)}
                    color={colors.neutral[400]}
                  />
                  <Text style={styles.metaText}>
                    {item.personsCount} pers.
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.txAmounts}>
            <Text style={styles.txGross}>{formatPrice(item.amountGross ?? 0)}</Text>
            <MBadge
              label={`-${item.discountPercent ?? 0}%`}
              variant="warning"
              size="sm"
            />
            <Text style={styles.txNet}>
              Net: {formatPrice(item.amountNet ?? 0)}
            </Text>
          </View>
        </View>
      </MCard>
    ),
    [],
  );

  if (txQ.isLoading) {
    return <LoadingSpinner message="Chargement de l'historique…" />;
  }

  if (txQ.isError) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#FF6A00', '#FFB347']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={wp(22)} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historique</Text>
        </LinearGradient>
        <ErrorState
          fullScreen
          title="Erreur de chargement"
          description="Impossible de charger l'historique des transactions."
          onRetry={() => txQ.refetch()}
          icon="receipt-outline"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Gradient header */}
      <LinearGradient
        colors={['#FF6A00', '#FFB347']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing[2] }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={wp(22)} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historique</Text>
        <Text style={styles.headerSubtitle}>
          {totalCount} transaction{totalCount !== 1 ? 's' : ''}
        </Text>

        {/* Summary pills in header */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryValue}>{formatPrice(totalGross)}</Text>
            <Text style={styles.summaryLabel}>CA Brut</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryPill}>
            <Text style={styles.summaryValue}>{formatPrice(totalDiscount)}</Text>
            <Text style={styles.summaryLabel}>Réductions</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryPill}>
            <Text style={styles.summaryValue}>{totalCount}</Text>
            <Text style={styles.summaryLabel}>Transactions</Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={items}
        keyExtractor={(item: any) => item.transactionId ?? Math.random().toString()}
        renderItem={renderTx}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (txQ.hasNextPage && !txQ.isFetchingNextPage) {
            txQ.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={txQ.isRefetching && !txQ.isFetchingNextPage}
            onRefresh={() => txQ.refetch()}
            tintColor={colors.violet[500]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="Aucune transaction"
            description="L'historique des transactions apparaîtra ici."
          />
        }
        ListFooterComponent={
          txQ.isFetchingNextPage ? (
            <LoadingSpinner message="" />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },

  header: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[5],
  },
  backBtn: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(18),
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  headerTitle: {
    ...textStyles.h3,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.75)',
    marginTop: spacing[1],
    marginBottom: spacing[4],
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
  },
  summaryPill: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: wp(28),
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  summaryValue: {
    ...textStyles.bodyBold,
    color: '#FFFFFF',
  },
  summaryLabel: {
    ...textStyles.micro,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing[1],
  },
  list: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: wp(100),
  },
  txCard: {
    marginBottom: spacing[2],
    backgroundColor: '#111827',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txIcon: {
    width: wp(40),
    height: wp(40),
    borderRadius: borderRadius.md,
    backgroundColor: colors.violet[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  txInfo: {
    flex: 1,
  },
  txName: {
    ...textStyles.body,
    fontFamily: fontFamily.medium,
    color: colors.neutral[900],
  },
  txDate: {
    ...textStyles.micro,
    color: colors.neutral[400],
    marginTop: spacing[1],
  },
  txMeta: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  metaText: {
    ...textStyles.micro,
    color: colors.neutral[400],
  },
  txAmounts: {
    alignItems: 'flex-end',
  },
  txGross: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  txNet: {
    ...textStyles.micro,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
});
