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
} from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { transactionsApi } from '../../src/api/transactions.api';
import { partnerColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import { formatPrice, formatDateTime, formatPercent } from '../../src/utils/format';
import {
  MCard,
  MBadge,
  MHeader,
  LoadingSpinner,
  EmptyState,
  ErrorState,
} from '../../src/components/ui';
import { usePartnerStore } from '../../src/stores/partner.store';

const PAGE_SIZE = 15;

export default function PartnerHistoryScreen() {
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
        <MHeader title="Historique" />
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
      <MHeader title="Historique" />

      {/* Summary */}
      <View style={styles.summaryRow}>
        <MCard style={styles.summaryCard} elevation="sm">
          <Text style={styles.summaryValue}>{formatPrice(totalGross)}</Text>
          <Text style={styles.summaryLabel}>CA Brut</Text>
        </MCard>
        <MCard style={styles.summaryCard} elevation="sm">
          <Text style={[styles.summaryValue, { color: colors.warning[500] }]}>
            {formatPrice(totalDiscount)}
          </Text>
          <Text style={styles.summaryLabel}>Réductions</Text>
        </MCard>
        <MCard style={styles.summaryCard} elevation="sm">
          <Text style={[styles.summaryValue, { color: colors.success[500] }]}>
            {totalCount}
          </Text>
          <Text style={styles.summaryLabel}>Transactions</Text>
        </MCard>
      </View>

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
  summaryRow: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[3],
    backgroundColor: '#111827',
  },
  summaryValue: {
    ...textStyles.h4,
    color: colors.violet[600],
  },
  summaryLabel: {
    ...textStyles.micro,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  list: {
    paddingHorizontal: spacing[4],
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
