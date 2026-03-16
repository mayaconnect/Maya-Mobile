/**
 * Maya Connect V2 — Transaction History Screen (Client)
 *
 * Infinite-scroll list of user transactions with savings summary.
 * Full error handling, loading, empty states.
 */
import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/auth.store';
import { transactionsApi } from '../../src/api/transactions.api';
import { clientColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import { formatPrice, formatDateTime, formatRelativeTime, formatPlanCode } from '../../src/utils/format';
import {
  MCard,
  MBadge,
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from '../../src/components/ui';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const PAGE_SIZE = 20;

  const txQ = useInfiniteQuery({
    queryKey: ['userTransactions', user?.id],
    queryFn: ({ pageParam = 1 }) =>
      transactionsApi.getByUser(user!.id, { page: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const data = lastPage.data;
      if (!data?.items) return undefined;
      const loaded = allPages.reduce((sum, p) => sum + (p.data?.items?.length ?? 0), 0);
      return loaded < (data.totalCount ?? 0) ? allPages.length + 1 : undefined;
    },
    enabled: !!user?.id,
  });

  const allTransactions = txQ.data?.pages?.flatMap((p) => p.data?.items ?? []) ?? [];

  const savingsQ = useQuery({
    queryKey: ['savingsByCategory', user?.id],
    queryFn: () => transactionsApi.getSavingsByCategory(user!.id),
    select: (res) => res.data,
    enabled: !!user?.id,
  });

  const renderTransaction = useCallback(
    ({ item }: { item: any }) => (
      <MCard style={styles.txCard}>
        <View style={styles.txRow}>
          {/* Icon */}
          <View style={styles.txIcon}>
            <Ionicons name="receipt-outline" size={wp(20)} color={colors.violet[500]} />
          </View>

          {/* Info */}
          <View style={styles.txInfo}>
            <Text style={styles.txStore} numberOfLines={1}>
              {item.storeName || 'Partenaire'}
            </Text>
            <Text style={styles.txMeta}>
              {formatPlanCode(item.planCode, item.personsCount)} • {item.createdAt ? formatRelativeTime(item.createdAt) : ''}
            </Text>
          </View>

          {/* Amounts */}
          <View style={styles.txAmounts}>
            <Text style={styles.txNet}>{formatPrice(item.amountNet ?? 0)}</Text>
            <View style={styles.discountRow}>
              <Ionicons name="trending-down" size={wp(12)} color={colors.success[500]} />
              <Text style={styles.txDiscount}>
                {formatPrice(item.discountAmount ?? 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.txFooter}>
          <MBadge
            label={`-${item.discountPercent ?? 0}%`}
            variant="success"
            size="sm"
          />
          <Text style={styles.txDate}>
            {item.createdAt ? formatDateTime(item.createdAt) : ''}
          </Text>
        </View>
      </MCard>
    ),
    [],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Historique</Text>
        <Text style={styles.subtitle}>
          Retrouvez toutes vos transactions Maya Connect
        </Text>
      </View>

      {/* Savings summary */}
      {savingsQ.data && savingsQ.data.length > 0 && (
        <View style={styles.savingsRow}>
          {savingsQ.data.slice(0, 3).map((cat: any, idx: number) => (
            <MCard key={idx} style={styles.savingsCard}>
              <Text style={styles.savingsValue}>
                {formatPrice(cat.amount ?? 0)}
              </Text>
              <Text style={styles.savingsLabel} numberOfLines={1}>
                {cat.category || 'Autre'}
              </Text>
            </MCard>
          ))}
        </View>
      )}

      {/* List */}
      {txQ.isLoading ? (
        <LoadingSpinner fullScreen message="Chargement de l'historique…" />
      ) : txQ.isError ? (
        <ErrorState
          fullScreen
          title="Erreur de chargement"
          description="Impossible de charger votre historique de transactions."
          onRetry={() => txQ.refetch()}
          icon="time-outline"
        />
      ) : (
        <FlatList
          data={allTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.transactionId}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (txQ.hasNextPage && !txQ.isFetchingNextPage) {
              txQ.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={txQ.isRefetching && !txQ.isFetchingNextPage}
              onRefresh={() => {
                txQ.refetch();
                savingsQ.refetch();
              }}
              tintColor={colors.orange[500]}
            />
          }
          ListFooterComponent={
            txQ.isFetchingNextPage ? (
              <ActivityIndicator
                size="small"
                color={colors.orange[500]}
                style={{ paddingVertical: spacing[4] }}
              />
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="time-outline"
              title="Aucune transaction"
              description="Scannez votre QR code chez un partenaire pour voir apparaître vos transactions ici."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  header: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
  },
  title: {
    ...textStyles.h2,
    color: colors.neutral[900],
  },
  subtitle: {
    ...textStyles.caption,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  /* Savings */
  savingsRow: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingHorizontal: spacing[6],
    marginVertical: spacing[3],
  },
  savingsCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[3],
    backgroundColor: '#1E293B',
  },
  savingsValue: {
    ...textStyles.h5,
    color: colors.success[500],
    fontFamily: fontFamily.bold,
  },
  savingsLabel: {
    ...textStyles.micro,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  /* List */
  list: {
    paddingHorizontal: spacing[6],
    paddingBottom: wp(100),
  },
  txCard: {
    marginBottom: spacing[3],
    backgroundColor: '#1E293B',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txIcon: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: colors.violet[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  txInfo: {
    flex: 1,
  },
  txStore: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
  },
  txMeta: {
    ...textStyles.micro,
    color: colors.neutral[400],
    marginTop: spacing[1],
  },
  txAmounts: {
    alignItems: 'flex-end',
  },
  txNet: {
    ...textStyles.body,
    fontFamily: fontFamily.bold,
    color: colors.neutral[900],
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginTop: spacing[1],
  },
  txDiscount: {
    ...textStyles.micro,
    color: colors.success[500],
    fontFamily: fontFamily.medium,
  },
  txFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[3],
    paddingTop: spacing[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral[100],
  },
  txDate: {
    ...textStyles.micro,
    color: colors.neutral[400],
  },
});
