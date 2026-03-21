/**
 * Maya Connect V2 — Store Operator Dashboard Screen
 *
 * Adapted from Partner Dashboard with:
 * - Title "Espace opérateur magasin"
 * - "Actions rapides" BEFORE "Vue globale"
 * - Routes point to /(storeoperator)/…
 * - Graceful handling when partnerId or activeStore are missing
 */
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storeOperatorsApi } from '../../src/api/store-operators.api';
import { transactionsApi } from '../../src/api/transactions.api';
import { useAuthStore } from '../../src/stores/auth.store';
import { usePartnerStore } from '../../src/stores/partner.store';
import { operatorColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import { formatPrice, formatNumber, formatDateTime, formatClientNameShort } from '../../src/utils/format';
import { Image } from 'react-native';
import { config } from '../../src/constants/config';
import {
  MCard,
  MBadge,
  MAvatar,
  LoadingSpinner,
  EmptyState,
  ErrorState,
} from '../../src/components/ui';

const DEFAULT_IMAGE = require('../../assets/images/centered_logo_gradient.png');

function resolveUri(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `${config.api.baseUrl}${raw.startsWith('/') ? '' : '/'}${raw}`;
}

function StoreThumb({ store, size }: { store: any; size: number }) {
  const uris = React.useMemo(() => {
    const candidates: string[] = [];
    const a = resolveUri(store?.imageUrl);
    const b = store?.id ? `${config.api.baseUrl}/api/stores/${store.id}/image` : null;
    if (a) candidates.push(a);
    if (b && b !== a) candidates.push(b);
    return candidates;
  }, [store?.imageUrl, store?.id]);

  const [index, setIndex] = React.useState(0);
  React.useEffect(() => { setIndex(0); }, [store?.id]);

  const uri = uris[index] ?? null;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: borderRadius.lg }}
        resizeMode="cover"
        onError={() => setIndex((i) => i + 1)}
      />
    );
  }
  return (
    <Image
      source={DEFAULT_IMAGE}
      style={{ width: size, height: size, borderRadius: borderRadius.lg }}
      resizeMode="contain"
    />
  );
}


type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export default function StoreOperatorDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const partner = usePartnerStore((s) => s.partner);
  const stores = usePartnerStore((s) => s.stores);
  const activeStoreZus = usePartnerStore((s) => s.activeStore);


  /* ---- Active store (with 404 graceful handling) ---- */
  const activeStoreQ = useQuery({
    queryKey: ['activeStore'],
    queryFn: () => storeOperatorsApi.getActiveStore(),
    select: (res) => res.data,
    retry: (count, error: any) => {
      // Don't retry on 404 — SO may have no active store set
      if (error?.response?.status === 404) return false;
      return count < 2;
    },
  });

  const storeId = activeStoreQ.data?.storeId ?? activeStoreZus?.storeId;

  // Map store name + data from the stores array
  const activeStoreData = useMemo(() => {
    if (!storeId) return null;
    return stores.find((s) => s.id === storeId) ?? null;
  }, [storeId, stores]);
  const activeStoreName = activeStoreData?.name ?? null;

  // Dériver partnerId depuis le magasin actif (pas depuis partner?.id qui
  // reflète toujours le 1er partenaire trouvé au init)
  const partnerId = useMemo(() => {
    if (storeId) {
      const found = stores.find((s) => s.id === storeId);
      if (found?.partnerId) return found.partnerId;
    }
    return partner?.id;
  }, [storeId, stores, partner?.id]);

  /* ---- Store scan count ---- */
  const storeScansQ = useQuery({
    queryKey: ['storeScanCount', storeId],
    queryFn: () => transactionsApi.getScanCount({ storeId }),
    enabled: !!storeId,
    select: (res) => res.data,
  });

  /* ---- Partner-level scan count (all stores) ---- */
  const partnerScansQ = useQuery({
    queryKey: ['partnerScanCount', partnerId],
    queryFn: () => transactionsApi.getScanCount({ partnerId }),
    enabled: !!partnerId,
    select: (res) => res.data,
  });

  /* ---- Partner-level transactions (all stores, recent) ---- */
  const partnerTxQ = useQuery({
    queryKey: ['partnerAllTx', partnerId],
    queryFn: () =>
      transactionsApi.getByPartner(partnerId!, { page: 1, pageSize: 20 }),
    enabled: !!partnerId,
    select: (res) => res.data,
  });

  /* ---- Active store recent transactions ---- */
  const recentQ = useQuery({
    queryKey: ['partnerRecentTx', partnerId, storeId],
    queryFn: () =>
      transactionsApi.getByPartner(partnerId!, { storeId, page: 1, pageSize: 5 }),
    enabled: !!partnerId,
    select: (res) => res.data,
  });

  const store = activeStoreQ.data;
  const recent = recentQ.data?.items ?? [];
  const allTx = partnerTxQ.data?.items ?? [];

  /* ---- Computed KPIs from transaction data ---- */
  const kpis = useMemo(() => {
    const totalGross = allTx.reduce((a: number, t: any) => a + (t.amountGross ?? 0), 0);
    const avgBasket = allTx.length > 0 ? totalGross / allTx.length : 0;
    return { avgBasket };
  }, [allTx]);

  const refreshing =
    activeStoreQ.isFetching ||
    recentQ.isFetching ||
    partnerTxQ.isFetching ||
    partnerScansQ.isFetching;

  const hasError =
    (activeStoreQ.isError && activeStoreQ.error?.response?.status !== 404) ||
    partnerTxQ.isError ||
    partnerScansQ.isError;

  const onRefresh = () => {
    activeStoreQ.refetch();
    partnerScansQ.refetch();
    storeScansQ.refetch();
    partnerTxQ.refetch();
    recentQ.refetch();
  };

  return (
    <View style={styles.container}>
      {/* Navy gradient header */}
      <LinearGradient
        colors={['#FF7A18', '#FF9F45']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing[2] }]}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>
              Bonjour, {user?.firstName ?? 'Opérateur'} 👋
            </Text>
            <Text style={styles.subtitle}>
              Espace opérateur magasin
            </Text>
          </View>
          <MAvatar
            name={user?.firstName ?? 'O'}
            uri={user?.avatarUrl}
            size="md"
          />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.violet[500]}
          />
        }
      >
        {/* Error banner */}
        {hasError ? (
          <ErrorState
            title="Erreur de chargement"
            description="Certaines données n'ont pas pu être chargées."
            onRetry={onRefresh}
            icon="cloud-offline-outline"
          />
        ) : null}

        {/* ── Quick actions (FIRST per user request) ── */}
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actionsRow}>
          {([
            { icon: 'scan', label: 'Scanner', route: '/(storeoperator)/scanner' },
            { icon: 'receipt', label: 'Historique', route: '/(storeoperator)/history' },
            { icon: 'storefront', label: 'Mes magasins', route: '/(storeoperator)/my-stores' },
          ] as { icon: IoniconsName; label: string; route: string }[]).map(
            (action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.actionBtn}
                onPress={() => router.push(action.route as any)}
              >
                <View style={styles.actionIcon}>
                  <Ionicons
                    name={action.icon}
                    size={wp(22)}
                    color={colors.violet[600]}
                  />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ),
          )}
        </View>

        {/* ── Active store card ── */}
        <Text style={styles.sectionTitle}>Magasin actif</Text>
        <MCard style={styles.storeCard} elevation="md">
          <View style={styles.storeRow}>
            <View style={styles.storeIcon}>
              {activeStoreData ? (
                <StoreThumb store={activeStoreData} size={wp(44)} />
              ) : (
                <Ionicons name="storefront" size={wp(22)} color={colors.violet[500]} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.storeLabel}>
                {storeId ? 'Magasin sélectionné' : 'Aucun magasin'}
              </Text>
              <Text style={styles.storeName}>
                {activeStoreName ?? `Magasin #${storeId?.slice(0, 6) ?? '—'}`}
              </Text>
              {storeScansQ.data ? (
                <Text style={styles.storeSubline}>
                  {formatNumber(storeScansQ.data.count)} scans
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(storeoperator)/my-stores')}
              style={styles.changeBtn}
            >
              <Text style={styles.changeTxt}>Changer</Text>
            </TouchableOpacity>
          </View>
        </MCard>

        {/* ── Global KPIs (partner-level) ── */}
        <Text style={styles.sectionTitle}>Vue globale</Text>
        <View style={styles.kpiRow}>
          <MCard style={styles.kpiCard} elevation="sm">
            <View style={[styles.statIconBox, { backgroundColor: colors.violet[50] }]}>
              <Ionicons name="scan" size={wp(20)} color={colors.violet[500]} />
            </View>
            <Text style={styles.avgValue}>{formatNumber(partnerScansQ.data?.count ?? 0)}</Text>
            <Text style={styles.avgLabel}>Scans total</Text>
          </MCard>

          <MCard style={styles.kpiCard} elevation="sm">
            <View style={[styles.statIconBox, { backgroundColor: colors.orange[50] }]}>
              <Ionicons name="storefront" size={wp(20)} color={colors.orange[500]} />
            </View>
            <Text style={styles.avgValue}>{formatNumber(stores.length)}</Text>
            <Text style={styles.avgLabel}>Magasins</Text>
          </MCard>
        </View>

        {/* Average basket card */}
        <MCard style={styles.avgCard} elevation="sm">
          <View style={styles.avgRow}>
            <View style={[styles.statIconBox, { backgroundColor: colors.violet[50] }]}>
              <Ionicons name="basket" size={wp(20)} color={colors.violet[500]} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing[3] }}>
              <Text style={styles.avgLabel}>Panier moyen</Text>
              <Text style={styles.avgValue}>{formatPrice(kpis.avgBasket)}</Text>
            </View>
            <MBadge
              label={`${allTx.length} tx`}
              variant="info"
              size="sm"
            />
          </View>
        </MCard>

        {/* ── Recent transactions (active store) ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Transactions récentes</Text>
          <TouchableOpacity onPress={() => router.push('/(storeoperator)/history')}>
            <Text style={styles.seeAll}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {recentQ.isLoading ? (
          <LoadingSpinner message="Chargement…" />
        ) : Array.isArray(recent) && recent.length > 0 ? (
          recent.map((tx: any) => (
            <MCard key={tx.transactionId ?? tx.id} style={styles.txCard} elevation="sm">
              <View style={styles.txRow}>
                <View style={styles.txIcon}>
                  <Ionicons name="receipt-outline" size={wp(18)} color={colors.violet[500]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txName} numberOfLines={1}>
                    {formatClientNameShort(tx.clientName ?? tx.customerName, `Client #${tx.customerUserId?.slice(0, 6) ?? '—'}`)}
                  </Text>
                  <Text style={styles.txDate}>{formatDateTime(tx.createdAt)}</Text>
                </View>
                <View style={styles.txAmounts}>
                  <Text style={styles.txGross}>{formatPrice(tx.amountGross ?? 0)}</Text>
                  <MBadge label={`-${tx.discountPercent ?? 0}%`} variant="warning" size="sm" />
                  <Text style={styles.txNet}>Net: {formatPrice(tx.amountNet ?? 0)}</Text>
                </View>
              </View>
            </MCard>
          ))
        ) : (
          <EmptyState
            icon="receipt-outline"
            title="Aucune transaction"
            description="Les transactions apparaîtront ici après les premiers scans."
          />
        )}

        <View style={{ height: wp(100) }} />
      </ScrollView>


    </View>
  );
}

/* ── Inline KPI stat card ── */
function KPIStat({
  icon,
  iconBg,
  iconColor,
  value,
  label,
}: {
  icon: IoniconsName;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
}) {
  return (
    <MCard style={styles.statCard} elevation="sm">
      <View style={[styles.statIconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={wp(20)} color={iconColor} />
      </View>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </MCard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  header: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[5],
    borderBottomLeftRadius: wp(32),
    borderBottomRightRadius: wp(32),
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    ...textStyles.h3,
    color: '#FFFFFF',
  },
  subtitle: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.75)',
    marginTop: spacing[1],
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing[4],
  },
  storeCard: {
    marginBottom: spacing[4],
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIcon: {
    width: wp(44),
    height: wp(44),
    borderRadius: borderRadius.lg,
    backgroundColor: colors.violet[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  storeLabel: {
    ...textStyles.micro,
    color: colors.neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  storeName: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
    marginTop: spacing[1],
  },
  storeSubline: {
    ...textStyles.micro,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  changeBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    backgroundColor: colors.violet[50],
  },
  changeTxt: {
    ...textStyles.caption,
    fontFamily: fontFamily.semiBold,
    color: colors.violet[600],
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  kpiRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  kpiCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  avgCard: {
    marginBottom: spacing[4],
  },
  avgRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avgLabel: {
    ...textStyles.micro,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  avgValue: {
    ...textStyles.h3,
    color: colors.neutral[900],
    marginTop: spacing[1],
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  statIconBox: {
    width: wp(36),
    height: wp(36),
    borderRadius: borderRadius.md,
    backgroundColor: colors.violet[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  statValue: {
    ...textStyles.h4,
    color: colors.neutral[900],
  },
  statLabel: {
    ...textStyles.micro,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.neutral[900],
  },
  seeAll: {
    ...textStyles.caption,
    fontFamily: fontFamily.semiBold,
    color: colors.violet[600],
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
  },
  actionIcon: {
    width: wp(52),
    height: wp(52),
    borderRadius: borderRadius.xl,
    backgroundColor: colors.violet[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  actionLabel: {
    ...textStyles.caption,
    fontFamily: fontFamily.medium,
    color: colors.neutral[700],
  },
  txCard: {
    marginBottom: spacing[2],
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
