/**
 * Maya Connect V2 — Store Operator Transaction History
 */
import React, { useCallback, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { transactionsApi } from '../../src/api/transactions.api';
import { storeOperatorsApi } from '../../src/api/store-operators.api';
import { usePartnerStore } from '../../src/stores/partner.store';
import { operatorColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import { formatPrice, formatDateTime, formatNumber, formatClientNameShort } from '../../src/utils/format';
import { LoadingSpinner, EmptyState, ErrorState } from '../../src/components/ui';

const PAGE_SIZE = 15;

export default function StoreOperatorHistoryScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const activeStore = usePartnerStore((s) => s.activeStore);
  const stores = usePartnerStore((s) => s.stores);
  const partner = usePartnerStore((s) => s.partner);

  // Source primaire : même appel API que le scanner
  const activeStoreQ = useQuery({
    queryKey: ['activeStore'],
    queryFn: () => storeOperatorsApi.getActiveStore(),
    select: (res) => res.data,
    staleTime: 30_000,
  });

  // storeId : API → Zustand → auth fallback
  const storeId = useMemo(() => {
    const opStores = user?.partnerData?.operatorStores ?? [];
    const resolved =
      activeStoreQ.data?.storeId ??
      activeStore?.storeId ??
      opStores.find((s) => s.isActiveStore)?.id ??
      opStores[0]?.id ??
      undefined;
    console.log('[HISTORY] storeId resolved:', resolved);
    return resolved;
  }, [activeStoreQ.data, activeStore, user]);

  // partnerId : Zustand partner → stores → auth fallback
  const partnerId = useMemo(() => {
    const opStores = user?.partnerData?.operatorStores ?? [];
    let resolved: string | undefined;
    if (partner?.id) { resolved = partner.id; }
    else if (storeId) {
      const fromStore = stores.find((s) => s.id === storeId)?.partnerId;
      if (fromStore) resolved = fromStore;
      else {
        const fromOp = opStores.find((s) => s.id === storeId);
        resolved = fromOp?.partnerId ?? fromOp?.partner?.id;
      }
    }
    if (!resolved) {
      resolved = opStores[0]?.partnerId ?? opStores[0]?.partner?.id;
    }
    console.log('[HISTORY] partnerId resolved:', resolved);
    return resolved;
  }, [partner, storeId, stores, user]);

  const storeName = useMemo(() => {
    if (!storeId) return 'Mon magasin';
    return (
      stores.find((s) => s.id === storeId)?.name ??
      user?.partnerData?.operatorStores?.find((s) => s.id === storeId)?.name ??
      'Mon magasin'
    );
  }, [storeId, stores, user]);

  const txQ = useInfiniteQuery({
    queryKey: ['operatorTxHistory', partnerId, storeId],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      console.log('[HISTORY] queryFn fired — storeId:', storeId, 'partnerId:', partnerId, 'page:', pageParam);
      const res = await transactionsApi.getFiltered({
        PartnerId: partnerId,
        StoreId: storeId,
        Page: pageParam,
        PageSize: PAGE_SIZE,
      });
      console.log('[HISTORY] API response — totalCount:', res.data.totalCount, 'items:', res.data.items?.length ?? 0);
      return res;
    },
    enabled: !!storeId,
    staleTime: 0,
    refetchOnMount: 'always',
    getNextPageParam: (lastPage) => {
      const d = lastPage.data;
      console.log('[HISTORY] getNextPageParam — page:', d.page, 'totalPages:', d.totalPages);
      return d.page < d.totalPages ? d.page + 1 : undefined;
    },
  });

  // Refetch dès que l'écran revient au premier plan
  useFocusEffect(
    useCallback(() => {
      if (storeId) txQ.refetch();
    }, [storeId]),
  );

  const items = txQ.data?.pages.flatMap((p) => p.data.items ?? []) ?? [];
  const totalCount = txQ.data?.pages[0]?.data.totalCount ?? 0;

  const totalDiscount = useMemo(
    () => items.reduce((a: number, t: any) => a + (t.discountAmount ?? 0), 0),
    [items],
  );
  const totalGross = useMemo(
    () => items.reduce((a: number, t: any) => a + (t.amountGross ?? 0), 0),
    [items],
  );

  const renderTx = useCallback(
    ({ item, index }: any) => (
      <View style={styles.txCard}>
        {/* Index bullet */}
        <View style={styles.txIndex}>
          <Text style={styles.txIndexText}>{String(index + 1).padStart(2, '0')}</Text>
        </View>

        <View style={styles.txMain}>
          <View style={styles.txTop}>
            <Text style={styles.txName} numberOfLines={1}>
              {formatClientNameShort(item.clientName ?? item.customerName, `Client #${item.customerUserId?.slice(0, 6) ?? '—'}`)}
            </Text>
            <Text style={styles.txGross}>{formatPrice(item.amountGross ?? 0)}</Text>
          </View>

          <View style={styles.txBottom}>
            <View style={styles.txMetaRow}>
              <Ionicons name="time-outline" size={wp(12)} color={colors.neutral[400]} />
              <Text style={styles.txDate}>{formatDateTime(item.createdAt)}</Text>
              {item.personsCount ? (
                <>
                  <View style={styles.dot} />
                  <Ionicons name="people-outline" size={wp(12)} color={colors.neutral[400]} />
                  <Text style={styles.txDate}>{item.personsCount} pers.</Text>
                </>
              ) : null}
            </View>

            <View style={styles.txBadgeRow}>
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>-{item.discountPercent ?? 0}%</Text>
              </View>
              <Text style={styles.txNet}>{formatPrice(item.amountNet ?? 0)} net</Text>
            </View>
          </View>
        </View>
      </View>
    ),
    [],
  );

  if (!storeId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Historique</Text>
        </View>
        <EmptyState
          icon="storefront-outline"
          title="Aucun magasin actif"
          description="Sélectionnez un magasin pour voir les transactions."
        />
      </View>
    );
  }

  if (txQ.isLoading) {
    return <LoadingSpinner fullScreen message="Chargement de l'historique…" />;
  }

  if (txQ.isError) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Historique</Text>
        </View>
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
      <FlatList
        data={items}
        renderItem={renderTx}
        keyExtractor={(item: any) => item.transactionId ?? item.id ?? Math.random().toString()}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + wp(80) }]}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (txQ.hasNextPage && !txQ.isFetchingNextPage) txQ.fetchNextPage();
        }}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={txQ.isRefetching}
            onRefresh={() => txQ.refetch()}
            tintColor={colors.violet[500]}
          />
        }
        ListHeaderComponent={
          <>
            {/* ── Gradient header ── */}
            <LinearGradient
              colors={['#FF7A18', '#FF9F45']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.heroHeader, { paddingTop: insets.top + spacing[5] }]}
            >
              <Text style={styles.heroSub}>Transactions</Text>
              <Text style={styles.heroTitle}>Historique</Text>

              <View style={styles.storePill}>
                <Ionicons name="storefront" size={wp(13)} color="rgba(255,255,255,0.7)" />
                <Text style={styles.storePillText} numberOfLines={1}>{storeName}</Text>
              </View>

              {/* KPIs */}
              <View style={styles.kpiRow}>
                <View style={styles.kpiItem}>
                  <Text style={styles.kpiValue}>{formatNumber(totalCount)}</Text>
                  <Text style={styles.kpiLabel}>Transactions</Text>
                </View>
                <View style={styles.kpiDivider} />
                <View style={styles.kpiItem}>
                  <Text style={styles.kpiValue}>{formatPrice(totalGross)}</Text>
                  <Text style={styles.kpiLabel}>Chiffre brut</Text>
                </View>
                <View style={styles.kpiDivider} />
                <View style={styles.kpiItem}>
                  <Text style={styles.kpiValue}>{formatPrice(totalDiscount)}</Text>
                  <Text style={styles.kpiLabel}>Réductions</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Section label */}
            {items.length > 0 && (
              <Text style={styles.listLabel}>
                {totalCount} transaction{totalCount > 1 ? 's' : ''}
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            title="Aucune transaction"
            description="Scannez le QR code d'un client pour enregistrer votre première transaction."
            icon="receipt-outline"
          />
        }
        ListFooterComponent={
          txQ.isFetchingNextPage ? <LoadingSpinner message="Chargement…" /> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },

  header: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
    backgroundColor: '#FFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[100],
  },
  headerTitle: {
    ...textStyles.h3,
    fontFamily: fontFamily.bold,
    color: colors.neutral[900],
  },

  /* ── Hero ── */
  heroHeader: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[6],
    borderBottomLeftRadius: wp(32),
    borderBottomRightRadius: wp(32),
    overflow: 'hidden',
  },
  heroSub: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing[1],
  },
  heroTitle: {
    ...textStyles.h2,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
    marginBottom: spacing[3],
  },
  storePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    alignSelf: 'flex-start',
    marginBottom: spacing[5],
  },
  storePillText: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: fontFamily.medium,
  },

  /* ── KPIs ── */
  kpiRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
  },
  kpiValue: {
    ...textStyles.h4,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  kpiLabel: {
    ...textStyles.micro,
    color: 'rgba(255,255,255,0.55)',
    marginTop: spacing[1],
  },
  kpiDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  /* ── List ── */
  listLabel: {
    ...textStyles.micro,
    color: colors.neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[3],
  },
  listContent: {
    gap: spacing[2],
  },

  /* ── Transaction card ── */
  txCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing[4],
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...shadows.sm,
  },
  txIndex: {
    width: wp(32),
    height: wp(32),
    borderRadius: borderRadius.lg,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  txIndexText: {
    ...textStyles.micro,
    fontFamily: fontFamily.bold,
    color: '#2563EB',
  },
  txMain: { flex: 1 },
  txTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  txName: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
    flex: 1,
    marginRight: spacing[3],
  },
  txGross: {
    ...textStyles.body,
    fontFamily: fontFamily.bold,
    color: colors.neutral[900],
  },
  txBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    flex: 1,
  },
  txDate: {
    ...textStyles.micro,
    color: colors.neutral[400],
  },
  dot: {
    width: wp(3),
    height: wp(3),
    borderRadius: wp(2),
    backgroundColor: colors.neutral[300],
  },
  txBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  discountBadge: {
    backgroundColor: colors.orange[50],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  discountBadgeText: {
    ...textStyles.micro,
    fontFamily: fontFamily.bold,
    color: colors.orange[500],
  },
  txNet: {
    ...textStyles.micro,
    color: colors.neutral[400],
  },
});
