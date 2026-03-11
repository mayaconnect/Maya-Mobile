/**
 * Maya Connect V2 — Client Home Screen
 *
 * Shows:
 *  • Welcome banner with user name
 *  • Subscription status card
 *  • Quick stats (scan count, savings)
 *  • Recent transactions
 *  • Featured partners
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/auth.store';
import { transactionsApi } from '../../src/api/transactions.api';
import { subscriptionsApi } from '../../src/api/subscriptions.api';
import { storesApi } from '../../src/api/stores.api';
import { clientColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp, hp } from '../../src/utils/responsive';
import { formatPrice, formatName, formatRelativeTime } from '../../src/utils/format';
import { MCard, MAvatar, MBadge, LoadingSpinner, ErrorState } from '../../src/components/ui';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.firstName || 'Utilisateur';

  /* ---- Queries ---- */
  const savingsQ = useQuery({
    queryKey: ['savings', user?.id],
    queryFn: () => transactionsApi.getSavingsByPeriod(user!.id, 'month'),
    select: (res) => res.data,
    enabled: !!user?.id,
  });

  const subscriptionQ = useQuery({
    queryKey: ['hasSubscription'],
    queryFn: () => subscriptionsApi.hasSubscription(),
    select: (res) => res.data,
  });

  const recentTxQ = useQuery({
    queryKey: ['recentTransactions', user?.id],
    queryFn: () => transactionsApi.getByUser(user!.id, { page: 1, pageSize: 5 }),
    select: (res) => res.data,
    enabled: !!user?.id,
  });

  /** Featured stores — uses POST /stores/search (accessible to all roles) */
  const featuredStoresQ = useQuery({
    queryKey: ['featuredStores'],
    queryFn: () => storesApi.search({ page: 1, pageSize: 8 }),
    select: (res) => res.data,
  });

  const isRefreshing =
    savingsQ.isRefetching ||
    subscriptionQ.isRefetching ||
    recentTxQ.isRefetching ||
    featuredStoresQ.isRefetching;

  const hasError =
    savingsQ.isError || subscriptionQ.isError;

  const onRefresh = () => {
    savingsQ.refetch();
    subscriptionQ.refetch();
    recentTxQ.refetch();
    featuredStoresQ.refetch();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: wp(100) }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colors.orange[500]}
        />
      }
    >
      {/* Header — Navy gradient */}
      <LinearGradient
        colors={['#FF7A18', '#FFB347']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing[4] }]}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.userName}>{firstName} 👋</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(client)/profile')}
          >
            <MAvatar
              uri={user?.avatarUrl}
              name={formatName(user?.firstName, user?.lastName)}
              size="md"
            />
          </TouchableOpacity>
        </View>

        {/* Subscription banner */}
        <MCard style={styles.subCard} elevation="lg">
          {subscriptionQ.data ? (
            <View style={styles.subContent}>
              <View>
                <MBadge label="Premium Actif" variant="success" size="sm" />
                <Text style={styles.subTitle}>Votre abonnement</Text>
                <Text style={styles.subDesc}>
                  Profitez de toutes vos remises partenaires
                </Text>
              </View>
              <Ionicons name="shield-checkmark" size={wp(36)} color={colors.success[500]} />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.subContent}
              onPress={() => router.push('/(client)/subscription')}
            >
              <View style={{ flex: 1 }}>
                <MBadge label="Aucun abonnement" variant="warning" size="sm" />
                <Text style={styles.subTitle}>Passez Premium</Text>
                <Text style={styles.subDesc}>
                  Débloquez des réductions exclusives dès maintenant
                </Text>
              </View>
              <Ionicons name="arrow-forward-circle" size={wp(36)} color={colors.orange[500]} />
            </TouchableOpacity>
          )}
        </MCard>
      </LinearGradient>

      {/* Global error banner */}
      {hasError && (
        <ErrorState
          title="Données indisponibles"
          description="Impossible de charger vos statistiques. Tirez vers le bas pour réessayer."
          icon="cloud-offline-outline"
          onRetry={onRefresh}
        />
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <MCard style={styles.statCard}>
          <Ionicons name="scan-outline" size={wp(24)} color={colors.orange[500]} />
          <Text style={styles.statValue}>
            {recentTxQ.data?.totalCount ?? '---'}
          </Text>
          <Text style={styles.statLabel}>Scans effectués</Text>
        </MCard>

        <MCard style={styles.statCard}>
          <Ionicons name="cash-outline" size={wp(24)} color={colors.success[500]} />
          <Text style={styles.statValue}>
            {savingsQ.data?.[0]
              ? formatPrice(savingsQ.data[0].amount ?? 0)
              : '0 €'}
          </Text>
          <Text style={styles.statLabel}>Économies totales</Text>
        </MCard>
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accès rapide</Text>
        <View style={styles.actionsGrid}>
          {[
            { icon: 'qr-code' as const, label: 'Mon QR', route: '/(client)/qrcode' },
            { icon: 'map' as const, label: 'Carte', route: '/(client)/stores-map' },
            { icon: 'storefront' as const, label: 'Partenaires', route: '/(client)/partners' },
            { icon: 'time' as const, label: 'Historique', route: '/(client)/history' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.actionItem}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.actionIcon}>
                <Ionicons name={item.icon} size={wp(22)} color={colors.orange[500]} />
              </View>
              <Text style={styles.actionLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transactions récentes</Text>
          <TouchableOpacity onPress={() => router.push('/(client)/history')}>
            <Text style={styles.seeAll}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {recentTxQ.isLoading ? (
          <LoadingSpinner />
        ) : recentTxQ.isError ? (
          <ErrorState
            title="Erreur de chargement"
            description="Impossible de charger vos transactions."
            onRetry={() => recentTxQ.refetch()}
            icon="receipt-outline"
          />
        ) : recentTxQ.data?.items?.length ? (
          recentTxQ.data.items.slice(0, 3).map((tx: any) => (
            <MCard key={tx.transactionId} style={styles.txCard}>
              <View style={styles.txRow}>
                <View style={styles.txIconWrap}>
                  <Ionicons name="receipt-outline" size={wp(20)} color={colors.violet[500]} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txStore}>{tx.storeName || 'Partenaire'}</Text>
                  <Text style={styles.txDate}>
                    {tx.createdAt ? formatRelativeTime(tx.createdAt) : ''}
                  </Text>
                </View>
                <View style={styles.txAmounts}>
                  <Text style={styles.txNet}>{formatPrice(tx.amountNet ?? 0)}</Text>
                  <Text style={styles.txDiscount}>
                    -{formatPrice(tx.discountAmount ?? 0)}
                  </Text>
                </View>
              </View>
            </MCard>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={wp(32)} color={colors.neutral[300]} />
            <Text style={styles.emptyText}>
              Aucune transaction pour le moment
            </Text>
          </View>
        )}
      </View>

      {/* Featured stores (accessible to all roles via POST /stores/search) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Magasins partenaires</Text>
          <TouchableOpacity onPress={() => router.push('/(client)/partners')}>
            <Text style={styles.seeAll}>Explorer</Text>
          </TouchableOpacity>
        </View>

        {featuredStoresQ.isError ? (
          <ErrorState
            title="Erreur de chargement"
            description="Impossible de charger les magasins."
            onRetry={() => featuredStoresQ.refetch()}
            icon="storefront-outline"
          />
        ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.partnersScroll}
        >
          {featuredStoresQ.data?.items?.map((store: any) => {
            const imageSource = store.imageUrl
              ? { uri: store.imageUrl }
              : store.partnerImageUrl
              ? { uri: store.partnerImageUrl }
              : require('../../assets/images/centered_logo_gradient.png');

            return (
              <TouchableOpacity
                key={store.id}
                style={styles.storeCard}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: '/(client)/partner-details',
                    params: { id: store.id },
                  })
                }
              >
                <Image source={imageSource} style={styles.storeImage} />
                <View style={styles.storeCardBody}>
                  <Text style={styles.storeName} numberOfLines={1}>
                    {store.name}
                  </Text>
                  <Text style={styles.storeCity} numberOfLines={1}>
                    {store.city}
                  </Text>
                  {store.avgDiscountPercent > 0 && (
                    <MBadge
                      label={`-${Math.round(store.avgDiscountPercent)}%`}
                      variant="orange"
                      size="sm"
                      style={{ marginTop: spacing[1], alignSelf: 'flex-start' }}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  /* Header */
  header: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[14],
    borderBottomLeftRadius: borderRadius['2xl'],
    borderBottomRightRadius: borderRadius['2xl'],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  headerLeft: {},
  greeting: {
    ...textStyles.body,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    ...textStyles.h2,
    color: '#FFFFFF',
  },
  subCard: {
    marginTop: spacing[2],
    backgroundColor: '#1E293B',
  },
  subContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subTitle: {
    ...textStyles.h5,
    color: colors.neutral[900],
    marginTop: spacing[2],
  },
  subDesc: {
    ...textStyles.caption,
    color: colors.neutral[500],
    marginTop: spacing[1],
    maxWidth: wp(220),
  },
  /* Stats */
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: wp(-30),
    paddingHorizontal: spacing[6],
    marginBottom: spacing[4],
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[4],
    backgroundColor: '#1E293B',
  },
  statValue: {
    ...textStyles.h3,
    color: colors.neutral[900],
    marginTop: spacing[2],
  },
  statLabel: {
    ...textStyles.micro,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  /* Section */
  section: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.neutral[900],
  },
  seeAll: {
    ...textStyles.caption,
    color: colors.orange[500],
    fontFamily: fontFamily.semiBold,
  },
  /* Actions */
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[3],
  },
  actionItem: {
    alignItems: 'center',
    width: wp(72),
  },
  actionIcon: {
    width: wp(52),
    height: wp(52),
    borderRadius: borderRadius.xl,
    backgroundColor: colors.orange[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  actionLabel: {
    ...textStyles.micro,
    color: colors.neutral[700],
    fontFamily: fontFamily.medium,
  },
  /* Transactions */
  txCard: {
    marginBottom: spacing[2],
    backgroundColor: '#1E293B',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txIconWrap: {
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
  txDate: {
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
  txDiscount: {
    ...textStyles.micro,
    color: colors.success[500],
    fontFamily: fontFamily.medium,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
  emptyText: {
    ...textStyles.body,
    color: colors.neutral[400],
    textAlign: 'center',
    marginTop: spacing[2],
  },
  /* Stores */
  partnersScroll: {
    gap: spacing[3],
    paddingRight: spacing[6],
  },
  storeCard: {
    width: wp(140),
    borderRadius: borderRadius.lg,
    backgroundColor: '#1E293B',
    ...shadows.sm,
    overflow: 'hidden',
  },
  storeImage: {
    width: '100%',
    height: wp(100),
    backgroundColor: colors.neutral[100],
  },
  storeCardBody: {
    padding: spacing[3],
  },
  storeName: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
  },
  storeCity: {
    ...textStyles.micro,
    color: colors.neutral[400],
    marginTop: spacing[1],
  },
});
