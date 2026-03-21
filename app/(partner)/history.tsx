/**
 * Maya Connect V2 — Partner Transaction History Screen
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
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { transactionsApi } from '../../src/api/transactions.api';
import { storeOperatorsApi } from '../../src/api/store-operators.api';
import { fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import { formatPrice, formatDateTime } from '../../src/utils/format';
import { LoadingSpinner, ErrorState } from '../../src/components/ui';
import { usePartnerStore } from '../../src/stores/partner.store';

const PAGE_SIZE = 15;

export default function PartnerHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const activeStoreZus = usePartnerStore((s) => s.activeStore);
  const partner = usePartnerStore((s) => s.partner);
  const partnerId = partner?.id ?? undefined;

  // Same pattern as dashboard — get active store from API first, fallback to Zustand
  const activeStoreQ = useQuery({
    queryKey: ['activeStore'],
    queryFn: () => storeOperatorsApi.getActiveStore(),
    select: (res) => res.data,
    retry: (count, error: any) => {
      if (error?.response?.status === 404) return false;
      return count < 2;
    },
  });

  const storeId = activeStoreQ.data?.storeId ?? activeStoreZus?.storeId ?? undefined;

  const txQ = useInfiniteQuery({
    queryKey: ['partnerTxHistory', partnerId, storeId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      transactionsApi.getFiltered({
        PartnerId: partnerId,
        StoreId: storeId,
        Page: pageParam,
        PageSize: PAGE_SIZE,
      }),
    enabled: !!partnerId || !!storeId,
    getNextPageParam: (lastPage) => {
      const d = lastPage.data;
      return d.page < d.totalPages ? d.page + 1 : undefined;
    },
  });

  const items = txQ.data?.pages.flatMap((p) => p.data.items ?? []) ?? [];
  const totalCount = txQ.data?.pages[0]?.data.totalCount ?? 0;

  const totalGross = items.reduce((a: number, t: any) => a + (t.amountGross ?? 0), 0);
  const totalDiscount = items.reduce((a: number, t: any) => a + (t.discountAmount ?? 0), 0);

  const renderTx = useCallback(
    ({ item }: any) => {
      const discount = item.discountPercent ?? 0;
      return (
        <View style={styles.txCard}>
          {/* Left accent */}
          <View style={[styles.txAccent, { backgroundColor: discount > 0 ? '#FBBF24' : '#6366F1' }]} />

          <View style={styles.txIcon}>
            <Ionicons name="receipt-outline" size={wp(16)} color="#6366F1" />
          </View>

          <View style={styles.txInfo}>
            <Text style={styles.txName} numberOfLines={1}>
              {item.customerName ?? `Transaction #${item.transactionId?.slice(0, 6) ?? '—'}`}
            </Text>
            <Text style={styles.txDate}>{formatDateTime(item.createdAt)}</Text>
            {item.personsCount ? (
              <View style={styles.txMeta}>
                <Ionicons name="people-outline" size={wp(11)} color="rgba(255,255,255,0.3)" />
                <Text style={styles.metaText}>{item.personsCount} pers.</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.txAmounts}>
            <Text style={styles.txGross}>{formatPrice(item.amountGross ?? 0)}</Text>
            {discount > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{discount}%</Text>
              </View>
            )}
            <Text style={styles.txNet}>{formatPrice(item.amountNet ?? 0)} net</Text>
          </View>
        </View>
      );
    },
    [],
  );

  const Header = (
    <LinearGradient
      colors={['#0D0E20', '#1a1b3e']}
      style={[styles.header, { paddingTop: insets.top + spacing[2] }]}
    >
      {/* Nav row */}
      <View style={styles.headerNav}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={wp(20)} color="rgba(255,255,255,0.85)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historique</Text>
        <View style={styles.countChip}>
          <Text style={styles.countChipText}>{totalCount} tx</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={[styles.statAccent, { backgroundColor: '#6366F1' }]} />
          <Text style={styles.statValue}>{formatPrice(totalGross)}</Text>
          <Text style={styles.statLabel}>CA brut</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={[styles.statAccent, { backgroundColor: '#FBBF24' }]} />
          <Text style={styles.statValue}>{formatPrice(totalDiscount)}</Text>
          <Text style={styles.statLabel}>Réductions</Text>
        </View>
      </View>
    </LinearGradient>
  );

  if (txQ.isLoading) return <LoadingSpinner message="Chargement de l'historique…" />;

  if (txQ.isError) {
    return (
      <View style={styles.container}>
        {Header}
        <ErrorState
          fullScreen
          title="Erreur de chargement"
          description="Impossible de charger l'historique."
          onRetry={() => txQ.refetch()}
          icon="receipt-outline"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Header}
      <FlatList
        data={items}
        keyExtractor={(item: any) => item.transactionId ?? Math.random().toString()}
        renderItem={renderTx}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + wp(100) }]}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (txQ.hasNextPage && !txQ.isFetchingNextPage) txQ.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={txQ.isRefetching && !txQ.isFetchingNextPage}
            onRefresh={() => txQ.refetch()}
            tintColor="#6366F1"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <Ionicons name="receipt-outline" size={wp(32)} color="rgba(255,255,255,0.15)" />
            </View>
            <Text style={styles.emptyTitle}>Aucune transaction</Text>
            <Text style={styles.emptyDesc}>L'historique apparaîtra ici.</Text>
          </View>
        }
        ListFooterComponent={txQ.isFetchingNextPage ? <LoadingSpinner message="" /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },

  /* Header */
  header: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[5],
    borderBottomLeftRadius: wp(24),
    borderBottomRightRadius: wp(24),
    ...shadows.md,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[5],
    gap: spacing[3],
  },
  backBtn: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(18),
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: wp(18),
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  countChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  countChipText: {
    fontSize: wp(11),
    fontFamily: fontFamily.semiBold,
    color: 'rgba(255,255,255,0.5)',
  },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
  },
  statAccent: {
    width: wp(24),
    height: 3,
    borderRadius: 2,
    marginBottom: spacing[2],
  },
  statValue: {
    fontSize: wp(13),
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: wp(9),
    fontFamily: fontFamily.medium,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: spacing[3],
  },

  /* List */
  list: {
    padding: spacing[4],
    gap: spacing[2],
  },

  /* Transaction card */
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: spacing[3],
    gap: spacing[3],
    overflow: 'hidden',
    ...shadows.sm,
  },
  txAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  txIcon: {
    width: wp(36),
    height: wp(36),
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(99,102,241,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing[1],
    flexShrink: 0,
  },
  txInfo: { flex: 1 },
  txName: {
    fontSize: wp(13),
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },
  txDate: {
    fontSize: wp(10),
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 2,
  },
  txMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metaText: {
    fontSize: wp(10),
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.3)',
  },
  txAmounts: { alignItems: 'flex-end', gap: 3 },
  txGross: {
    fontSize: wp(13),
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  discountBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
  },
  discountText: {
    fontSize: wp(9),
    fontFamily: fontFamily.semiBold,
    color: '#FBBF24',
  },
  txNet: {
    fontSize: wp(9),
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.3)',
  },

  /* Empty */
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: wp(60),
    gap: spacing[3],
  },
  emptyIcon: {
    width: wp(64),
    height: wp(64),
    borderRadius: wp(32),
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: wp(15),
    fontFamily: fontFamily.semiBold,
    color: 'rgba(255,255,255,0.4)',
  },
  emptyDesc: {
    fontSize: wp(12),
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.2)',
  },
});
