/**
 * Maya Connect V2 — Store Operator Transaction History
 *
 * Paginated list of transactions scoped to the operator's active store.
 * StoreOperators can only see transactions from their assigned store.
 */
import React, { useCallback, useMemo } from 'react';
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
import { usePartnerStore } from '../../src/stores/partner.store';
import { operatorColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import { formatPrice, formatDateTime, formatNumber, formatClientNameShort } from '../../src/utils/format';
import {
  MCard,
  MBadge,
  MHeader,
  LoadingSpinner,
  EmptyState,
  ErrorState,
} from '../../src/components/ui';

const PAGE_SIZE = 15;

export default function StoreOperatorHistoryScreen() {
  const activeStore = usePartnerStore((s) => s.activeStore);
  const stores = usePartnerStore((s) => s.stores);
  const storeId = activeStore?.storeId;

  // Map store name from stores array
  const storeName = useMemo(() => {
    if (!storeId) return 'Mon magasin';
    const found = stores.find((s) => s.id === storeId);
    return found?.name ?? 'Mon magasin';
  }, [storeId, stores]);

  const txQ = useInfiniteQuery({
    queryKey: ['operatorTxHistory', storeId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      transactionsApi.getFiltered({
        StoreId: storeId,
        Page: pageParam,
        PageSize: PAGE_SIZE,
      }),
    enabled: !!storeId,
    getNextPageParam: (lastPage) => {
      const d = lastPage.data;
      return d.page < d.totalPages ? d.page + 1 : undefined;
    },
  });

  const items = txQ.data?.pages.flatMap((p) => p.data.items ?? []) ?? [];
  const totalCount = txQ.data?.pages[0]?.data.totalCount ?? 0;

  // KPI computations
  const totalDiscount = useMemo(
    () => items.reduce((a: number, t: any) => a + (t.discountAmount ?? 0), 0),
    [items],
  );

  const renderTx = useCallback(
    ({ item }: any) => (
      <MCard style={styles.txCard} elevation="sm">
        <View style={styles.txRow}>
          <View style={styles.txIcon}>
            <Ionicons name="receipt-outline" size={wp(18)} color={colors.violet[500]} />
          </View>

          <View style={styles.txInfo}>
            <Text style={styles.txName} numberOfLines={1}>
              {formatClientNameShort(item.clientName ?? item.customerName, `Transaction #${item.transactionId?.slice(0, 6) ?? '—'}`)}
            </Text>
            <Text style={styles.txDate}>{formatDateTime(item.createdAt)}</Text>
            {item.personsCount ? (
              <View style={styles.txMeta}>
                <Ionicons name="people-outline" size={wp(12)} color={colors.neutral[400]} />
                <Text style={styles.metaText}>{item.personsCount} pers.</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.txAmounts}>
            <Text style={styles.txGross}>{formatPrice(item.amountGross ?? 0)}</Text>
            <MBadge label={`-${item.discountPercent ?? 0}%`} variant="warning" size="sm" />
            <Text style={styles.txNet}>Net: {formatPrice(item.amountNet ?? 0)}</Text>
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

      {/* KPI Summary */}
      <View style={styles.kpiRow}>
        <MCard style={styles.kpiCard} elevation="sm">
          <Text style={styles.kpiValue}>{formatNumber(totalCount)}</Text>
          <Text style={styles.kpiLabel}>Transactions</Text>
        </MCard>
        <MCard style={styles.kpiCard} elevation="sm">
          <Text style={styles.kpiValue}>{formatPrice(totalDiscount)}</Text>
          <Text style={styles.kpiLabel}>Réductions</Text>
        </MCard>
      </View>

      {/* Active store label */}
      <View style={styles.storeLabel}>
        <Ionicons name="storefront" size={wp(14)} color={colors.violet[500]} />
        <Text style={styles.storeLabelText} numberOfLines={1}>
          {storeName}
        </Text>
        <MBadge label={`${totalCount} tx`} variant="violet" size="sm" />
      </View>

      <FlatList
        data={items}
        renderItem={renderTx}
        keyExtractor={(item: any) => item.transactionId ?? item.id ?? Math.random().toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (txQ.hasNextPage && !txQ.isFetchingNextPage) {
            txQ.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={txQ.isRefetching}
            onRefresh={() => txQ.refetch()}
            tintColor={colors.violet[500]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="Aucune transaction"
            description="Scannez le QR code d'un client pour enregistrer votre première transaction."
            icon="receipt-outline"
          />
        }
        ListFooterComponent={
          txQ.isFetchingNextPage ? (
            <LoadingSpinner message="Chargement…" />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  kpiRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    gap: spacing[3],
  },
  kpiCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  kpiValue: {
    ...textStyles.h3,
    fontFamily: fontFamily.bold,
    color: colors.violet[600],
  },
  kpiLabel: {
    ...textStyles.micro,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  storeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
    gap: spacing[2],
  },
  storeLabelText: {
    ...textStyles.caption,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[700],
    flex: 1,
  },
  listContent: {
    padding: spacing[4],
    paddingBottom: wp(100),
  },
  txCard: {
    marginBottom: spacing[3],
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txIcon: {
    width: wp(36),
    height: wp(36),
    borderRadius: borderRadius.md,
    backgroundColor: colors.violet[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  txInfo: {
    flex: 1,
    marginRight: spacing[3],
  },
  txName: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
  },
  txDate: {
    ...textStyles.micro,
    color: colors.neutral[400],
    marginTop: spacing[1],
  },
  txMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[1],
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
  },
  txNet: {
    ...textStyles.micro,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
});
