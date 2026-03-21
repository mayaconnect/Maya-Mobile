/**
 * Maya Connect V2 — Partner Dashboard Screen
 * Dark redesign — cohérent avec profile, team, store-management
 */
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { storeOperatorsApi } from '../../src/api/store-operators.api';
import { transactionsApi } from '../../src/api/transactions.api';
import { useAuthStore } from '../../src/stores/auth.store';
import { usePartnerStore } from '../../src/stores/partner.store';
import { partnerColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import { formatPrice, formatNumber, formatDateTime } from '../../src/utils/format';
import { MAvatar, LoadingSpinner, ErrorState } from '../../src/components/ui';
import { config } from '../../src/constants/config';

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
        style={{ width: size, height: size, borderRadius: borderRadius.xl }}
        resizeMode="cover"
        onError={() => setIndex((i) => i + 1)}
      />
    );
  }
  return (
    <Image
      source={DEFAULT_IMAGE}
      style={{ width: size, height: size, borderRadius: borderRadius.xl }}
      resizeMode="contain"
    />
  );
}

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

/* ── helpers ── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export default function PartnerDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const partner = usePartnerStore((s) => s.partner);
  const stores = usePartnerStore((s) => s.stores);
  const activeStoreZus = usePartnerStore((s) => s.activeStore);

  const partnerId = partner?.id;

  /* ---- Active store ---- */
  const activeStoreQ = useQuery({
    queryKey: ['activeStore'],
    queryFn: () => storeOperatorsApi.getActiveStore(),
    select: (res) => res.data,
    retry: (count, error: any) => {
      if (error?.response?.status === 404) return false;
      return count < 2;
    },
  });

  const storeId = activeStoreQ.data?.storeId ?? activeStoreZus?.storeId;

  const activeStoreData = useMemo(
    () => stores.find((s) => s.id === storeId) ?? null,
    [storeId, stores],
  );
  const activeStoreName = activeStoreData?.name ?? null;

  /* ---- Queries ---- */
  const partnerScansQ = useQuery({
    queryKey: ['partnerScanCount', partnerId],
    queryFn: () => transactionsApi.getScanCount({ partnerId }),
    enabled: !!partnerId,
    select: (res) => res.data,
  });

  const storeScansQ = useQuery({
    queryKey: ['storeScanCount', storeId],
    queryFn: () => transactionsApi.getScanCount({ storeId }),
    enabled: !!storeId,
    select: (res) => res.data,
  });

  const partnerTxQ = useQuery({
    queryKey: ['partnerAllTx', partnerId],
    queryFn: () => transactionsApi.getByPartner(partnerId!, { page: 1, pageSize: 20 }),
    enabled: !!partnerId,
    select: (res) => res.data,
  });

  const recentQ = useQuery({
    queryKey: ['partnerRecentTx', storeId],
    queryFn: () => transactionsApi.getFiltered({ StoreId: storeId, Page: 1, PageSize: 5 }),
    enabled: !!storeId,
    select: (res) => res.data,
  });

  const store = activeStoreQ.data;
  const recent = recentQ.data?.items ?? [];
  const allTx = partnerTxQ.data?.items ?? [];

  /* ---- KPIs ---- */
  const kpis = useMemo(() => {
    const totalGross = allTx.reduce((a: number, t: any) => a + (t.amountGross ?? 0), 0);
    const totalDiscount = allTx.reduce((a: number, t: any) => a + (t.discountAmount ?? 0), 0);
    const totalNet = totalGross - totalDiscount;
    const totalPersons = allTx.reduce((a: number, t: any) => a + (t.personsCount ?? 0), 0);
    const avgBasket = allTx.length > 0 ? totalGross / allTx.length : 0;
    return { totalGross, totalDiscount, totalNet, totalPersons, avgBasket };
  }, [allTx]);

  const refreshing =
    activeStoreQ.isFetching || recentQ.isFetching ||
    partnerTxQ.isFetching || partnerScansQ.isFetching;

  const hasError =
    (activeStoreQ.isError && (activeStoreQ.error as any)?.response?.status !== 404) ||
    partnerTxQ.isError || partnerScansQ.isError;

  const onRefresh = () => {
    activeStoreQ.refetch();
    partnerScansQ.refetch();
    storeScansQ.refetch();
    partnerTxQ.refetch();
    recentQ.refetch();
  };

  return (
    <View style={styles.bg}>

      {/* ── Header ── */}
      <LinearGradient
        colors={['#0D0E20', '#1a1b3e']}
        style={[styles.header, { paddingTop: insets.top + spacing[3] }]}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>
              {getGreeting()}, {user?.firstName ?? 'Partenaire'} 👋
            </Text>
            <Text style={styles.partnerName} numberOfLines={1}>
              {partner?.displayName ?? partner?.legalName ?? 'Espace partenaire'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(partner)/profile' as any)} activeOpacity={0.8}>
            <MAvatar name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} uri={user?.avatarUrl} size="md" />
          </TouchableOpacity>
        </View>

        {/* Scanner CTA */}
        <TouchableOpacity
          style={styles.scannerCta}
          onPress={() => router.push('/(partner)/scanner' as any)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#4F46E5', '#6366F1']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.scannerGradient}
          >
            <View style={styles.scannerIcon}>
              <Ionicons name="scan" size={wp(20)} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.scannerCtaTitle}>Scanner un client</Text>
              <Text style={styles.scannerCtaSub}>Appuyez pour ouvrir le scanner</Text>
            </View>
            <Ionicons name="chevron-forward" size={wp(18)} color="rgba(255,255,255,0.6)" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + wp(120) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF7A18" />
        }
      >
        {hasError && (
          <ErrorState
            title="Erreur de chargement"
            description="Certaines données n'ont pas pu être chargées."
            onRetry={onRefresh}
            icon="cloud-offline-outline"
          />
        )}

        {/* ── Magasin actif ── */}
        <SectionLabel label="Magasin actif" />
        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.storeCard}>
          <View style={styles.storeIconWrap}>
            {activeStoreData ? (
              <StoreThumb store={activeStoreData} size={wp(44)} />
            ) : (
              <Ionicons name="storefront-outline" size={wp(22)} color="#6366F1" />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.storeLabel}>
              {storeId ? 'Sélectionné' : 'Aucun magasin actif'}
            </Text>
            <Text style={styles.storeName} numberOfLines={1}>
              {activeStoreName ?? `Magasin #${store?.storeId?.slice(0, 6) ?? '—'}`}
            </Text>
            {storeScansQ.data ? (
              <Text style={styles.storeSub}>{formatNumber(storeScansQ.data.count)} scans</Text>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(partner)/stores' as any)}
            style={styles.changeBtn}
          >
            <Text style={styles.changeTxt}>Changer</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Quick actions ── */}
        <SectionLabel label="Actions rapides" />
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.actionsRow}>
          {([
            { icon: 'receipt-outline', label: 'Historique', route: '/(partner)/history' },
            { icon: 'storefront-outline', label: 'Magasins', route: '/(partner)/stores' },
            { icon: 'people-outline', label: 'Équipe', route: '/(partner)/team' },
            { icon: 'settings-outline', label: 'Gestion', route: '/(partner)/store-management' },
          ] as { icon: IoniconsName; label: string; route: string }[]).map(
            (action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.actionBtn}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.7}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name={action.icon} size={wp(22)} color="#6366F1" />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ),
          )}
        </Animated.View>

        {/* ── KPIs ── */}
        <SectionLabel label="Vue globale" />
        <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.kpiGrid}>
          <KPICard value={formatNumber(partnerScansQ.data?.count ?? 0)} label="Scans total" />
          <KPICard value={formatNumber(stores.length)} label="Magasins" />
          <KPICard value={formatNumber(kpis.totalPersons)} label="Personnes" />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.kpiGrid}>
          <KPICard value={formatPrice(kpis.totalGross)} label="CA brut" />
          <KPICard value={formatPrice(kpis.totalDiscount)} label="Réductions" />
          <KPICard value={formatPrice(kpis.totalNet)} label="CA net" />
        </Animated.View>

        {/* Panier moyen — large card */}
        <Animated.View entering={FadeInDown.delay(220).springify()} style={styles.avgCard}>
          <View style={[styles.kpiAccent, { backgroundColor: '#6366F1' }]} />
          <View style={styles.avgInner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.avgLabel}>Panier moyen</Text>
              <Text style={styles.avgValue}>{formatPrice(kpis.avgBasket)}</Text>
            </View>
            <View style={styles.txCountBadge}>
              <Text style={styles.txCountText}>{allTx.length} tx</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Transactions récentes ── */}
        <SectionLabel label="Transactions récentes" />
        {Array.isArray(recent) && recent.length > 0 ? (
          recent.map((tx: any, i: number) => (
            <Animated.View key={tx.transactionId} entering={FadeInDown.delay(260 + i * 40).springify()}>
              <TxRow tx={tx} />
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyTx}>
            <View style={styles.emptyTxIcon}>
              <Ionicons name="receipt-outline" size={wp(28)} color="rgba(255,255,255,0.15)" />
            </View>
            <Text style={styles.emptyTxText}>Aucune transaction récente</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* ── Section label ── */
function SectionLabel({ label }: { label: string }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

/* ── KPI card ── */
function KPICard({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.kpiCard}>
      <View style={styles.kpiAccent} />
      <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

/* ── Transaction row ── */
function TxRow({ tx }: { tx: any }) {
  const discountPct = tx.discountPercent ?? 0;
  return (
    <View style={styles.txCard}>
      <View style={styles.txIconWrap}>
        <Ionicons name="receipt-outline" size={wp(16)} color="#6366F1" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.txName} numberOfLines={1}>
          {tx.customerName ?? `Client #${tx.customerUserId?.slice(0, 6) ?? '—'}`}
        </Text>
        <Text style={styles.txDate}>{formatDateTime(tx.createdAt)}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={styles.txAmount}>{formatPrice(tx.amountGross ?? 0)}</Text>
        {discountPct > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPct}%</Text>
          </View>
        )}
      </View>
    </View>
  );
}

/* ────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#0F172A' },

  /* Header */
  header: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    borderBottomLeftRadius: wp(24),
    borderBottomRightRadius: wp(24),
    ...shadows.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  greeting: {
    fontSize: wp(18),
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  partnerName: {
    fontSize: wp(12),
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 3,
  },

  /* Scanner CTA */
  scannerCta: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    ...shadows.sm,
  },
  scannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  scannerIcon: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(18),
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerCtaTitle: {
    fontSize: wp(14),
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  scannerCtaSub: {
    fontSize: wp(10),
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  /* Scroll */
  scroll: { padding: spacing[4], gap: spacing[3] },

  /* Section label */
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[3],
    marginTop: spacing[1],
  },
  sectionLabel: {
    fontSize: wp(11),
    fontFamily: fontFamily.bold,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  /* Quick actions */
  actionsRow: {
    flexDirection: 'row',
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[2],
  },
  actionIcon: {
    width: wp(54),
    height: wp(54),
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
    backgroundColor: 'rgba(99,102,241,0.1)',
  },
  actionLabel: {
    fontSize: wp(10),
    fontFamily: fontFamily.semiBold,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
  },

  /* KPI grid */
  kpiGrid: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: spacing[3],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    alignItems: 'center',
    gap: spacing[1],
    overflow: 'hidden',
    ...shadows.sm,
  },
  kpiAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    backgroundColor: '#6366F1',
  },
  kpiValue: {
    fontSize: wp(17),
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  kpiLabel: {
    fontSize: wp(9),
    fontFamily: fontFamily.medium,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
  },

  /* Panier moyen */
  avgCard: {
    backgroundColor: '#1E293B',
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: spacing[4],
    overflow: 'hidden',
    ...shadows.sm,
  },
  avgInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
  },
  avgLabel: {
    fontSize: wp(10),
    fontFamily: fontFamily.medium,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  avgValue: {
    fontSize: wp(22),
    fontFamily: fontFamily.bold,
    color: '#6366F1',
    marginTop: 3,
  },
  txCountBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  txCountText: {
    fontSize: wp(11),
    fontFamily: fontFamily.semiBold,
    color: 'rgba(255,255,255,0.4)',
  },

  /* Active store */
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: spacing[4],
    gap: spacing[3],
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  storeIconWrap: {
    width: wp(44),
    height: wp(44),
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(99,102,241,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeLabel: {
    fontSize: wp(10),
    fontFamily: fontFamily.medium,
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  storeName: {
    fontSize: wp(14),
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
    marginTop: 2,
  },
  storeSub: {
    fontSize: wp(10),
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 2,
  },
  changeBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(99,102,241,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
  },
  changeTxt: {
    fontSize: wp(11),
    fontFamily: fontFamily.semiBold,
    color: '#6366F1',
  },

  /* Transactions */
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: spacing[3],
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  txIconWrap: {
    width: wp(36),
    height: wp(36),
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(99,102,241,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txName: {
    fontSize: wp(13),
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },
  txDate: {
    fontSize: wp(10),
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: spacing[1],
  },
  txAmount: {
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

  /* Empty transactions */
  emptyTx: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    gap: spacing[3],
  },
  emptyTxIcon: {
    width: wp(60),
    height: wp(60),
    borderRadius: wp(30),
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTxText: {
    fontSize: wp(13),
    fontFamily: fontFamily.medium,
    color: 'rgba(255,255,255,0.2)',
  },
});
