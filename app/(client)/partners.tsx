/**
 * Maya Connect V2 — Partners List Screen
 * Pagination client-side — grid 2 colonnes + navigateur de pages
 */
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { storesApi } from '../../src/api/stores.api';
import { referentielApi } from '../../src/api/referentiel.api';
import { subscriptionsApi } from '../../src/api/subscriptions.api';
import { promoCodesApi } from '../../src/api/promo-codes.api';
import { clientColors as colors } from '../../src/theme/colors';
import { textStyles, fontFamily } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { wp } from '../../src/utils/responsive';
import {
  MSearchBar,
  MBadge,
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from '../../src/components/ui';
import { useDebounced } from '../../src/hooks/use-debounced';
import { config } from '../../src/constants/config';
import type { StoreDto, StoreCategoryDto, PartnerPromoCodeDto } from '../../src/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - spacing[6] * 2 - spacing[3]) / 2;
const DEFAULT_STORE_IMAGE = require('../../assets/images/centered_logo_gradient.png');
const PER_PAGE = 12; // items par page dans la grille
const FETCH_SIZE = 200; // charge un max de stores une fois

/** Image avec fallback sur erreur */
function StoreImage({ store, style }: { store: StoreDto; style: any }) {
  const [errored, setErrored] = React.useState(false);
  const directUri = (store as any).imageUrl || (store as any).partnerImageUrl || null;
  const fallbackUri = store.partnerId
    ? `${config.api.baseUrl}/api/partners/${store.partnerId}/image`
    : null;
  const imageUri = directUri || fallbackUri;
  const source = !errored && imageUri ? { uri: imageUri } : DEFAULT_STORE_IMAGE;
  return (
    <Image
      source={source}
      style={style}
      resizeMode={!errored && imageUri ? 'cover' : 'contain'}
      onError={() => setErrored(true)}
    />
  );
}

/* ── Navigateur de pages ── */
function PageNav({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
}) {
  if (total <= 1) return null;

  // Calcul des pages à afficher (max 5 pilules)
  const pages: (number | '…')[] = [];
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    const start = Math.max(2, page - 1);
    const end = Math.min(total - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < total - 2) pages.push('…');
    pages.push(total);
  }

  return (
    <View style={pnStyles.row}>
      {/* Prev */}
      <TouchableOpacity
        style={[pnStyles.chevron, page === 1 && pnStyles.chevronDisabled]}
        onPress={() => onChange(page - 1)}
        disabled={page === 1}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={wp(16)} color={page === 1 ? colors.neutral[300] : colors.orange[500]} />
      </TouchableOpacity>

      {/* Page pills */}
      {pages.map((p, i) =>
        p === '…' ? (
          <Text key={`dots-${i}`} style={pnStyles.dots}>…</Text>
        ) : (
          <TouchableOpacity
            key={p}
            style={[pnStyles.pill, p === page && pnStyles.pillActive]}
            onPress={() => onChange(p as number)}
            activeOpacity={0.7}
          >
            {p === page ? (
              <LinearGradient
                colors={[...colors.gradients.primary]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={pnStyles.pillGradient}
              >
                <Text style={pnStyles.pillTextActive}>{p}</Text>
              </LinearGradient>
            ) : (
              <Text style={pnStyles.pillText}>{p}</Text>
            )}
          </TouchableOpacity>
        )
      )}

      {/* Next */}
      <TouchableOpacity
        style={[pnStyles.chevron, page === total && pnStyles.chevronDisabled]}
        onPress={() => onChange(page + 1)}
        disabled={page === total}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-forward" size={wp(16)} color={page === total ? colors.neutral[300] : colors.orange[500]} />
      </TouchableOpacity>
    </View>
  );
}

export default function PartnersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPromoView, setIsPromoView] = useState(false);
  const [copiedCodeKey, setCopiedCodeKey] = useState<string | null>(null);
  const [revealedCodeKeys, setRevealedCodeKeys] = useState<Set<string>>(() => new Set());
  const [openPartnerGroupKeys, setOpenPartnerGroupKeys] = useState<Set<string>>(() => new Set());
  const [showRequestAnotherCode, setShowRequestAnotherCode] = useState(false);
  const [showAssignPartnerModal, setShowAssignPartnerModal] = useState(false);
  const [selectedAssignPartnerKey, setSelectedAssignPartnerKey] = useState<string | null>(null);
  const [selectedAssignExternalPartnerId, setSelectedAssignExternalPartnerId] = useState<string | null>(null);
  const [selectedAssignPartnerName, setSelectedAssignPartnerName] = useState<string | null>(null);
  const debouncedSearch = useDebounced(search, 400);

  // Reset page quand le filtre/recherche change
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, selectedCategory]);
  // Reset affichage des codes quand on change de vue
  useEffect(() => {
    setRevealedCodeKeys(new Set());
    setCopiedCodeKey(null);
    setOpenPartnerGroupKeys(new Set());
    setShowRequestAnotherCode(false);
    setShowAssignPartnerModal(false);
    setSelectedAssignPartnerKey(null);
    setSelectedAssignExternalPartnerId(null);
    setSelectedAssignPartnerName(null);
  }, [isPromoView]);

  useEffect(() => {
    if (!showAssignPartnerModal) return;
    // Forcer une sélection par défaut quand la modale s'ouvre
    setSelectedAssignPartnerKey(null);
    setSelectedAssignExternalPartnerId(null);
    setSelectedAssignPartnerName(null);
  }, [showAssignPartnerModal]);

  const getPromoCodeKey = (c: PartnerPromoCodeDto) => `${(c as any).promoCodeId ?? c.id ?? 'no-id'}:${c.code}`;
  const getPromoCodeId = (c: PartnerPromoCodeDto) => (c as any).promoCodeId ?? c.id;

  const maskPromoCode = (raw: string) => raw.replace(/./g, '*');
  const toggleRevealCode = (key: string) => {
    setRevealedCodeKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ── Fetch store categories ──
  const categoriesQ = useQuery({
    queryKey: ['storeCategories'],
    queryFn: () => referentielApi.getStoreCategories(),
    select: (res) => res.data,
    staleTime: 30 * 60 * 1000,
  });

  // ── Fetch tous les stores (grand batch unique) ──
  const storesQ = useInfiniteQuery({
    queryKey: ['partners'],
    queryFn: ({ pageParam = 1 }) =>
      storesApi.search({ page: pageParam, pageSize: FETCH_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const data = lastPage.data;
      if (!data?.items) return undefined;
      const loaded = allPages.reduce((sum, p) => sum + (p.data?.items?.length ?? 0), 0);
      return loaded < (data.totalCount ?? 0) ? allPages.length + 1 : undefined;
    },
  });

  const allStores = useMemo(
    () => storesQ.data?.pages?.flatMap((p) => p.data?.items ?? []) ?? [],
    [storesQ.data],
  );

  // ── Filtre recherche ──
  const filteredStores = useMemo(() => {
    let result = allStores;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (s: StoreDto) =>
          (s.name ?? '').toLowerCase().includes(q) ||
          (s.partnerName ?? '').toLowerCase().includes(q) ||
          (s.city ?? '').toLowerCase().includes(q) ||
          (s.category ?? '').toLowerCase().includes(q),
      );
    }
    if (selectedCategory) {
      result = result.filter((s: StoreDto) => (s.categoryId ?? 'other') === selectedCategory);
    }
    return result;
  }, [allStores, debouncedSearch, selectedCategory]);

  // ── Pagination client-side ──
  const totalPages = Math.max(1, Math.ceil(filteredStores.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = useMemo(
    () => filteredStores.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE),
    [filteredStores, safePage],
  );

  // ── Catégories actives ──
  const storesByCategory = useMemo(() => {
    const map = new Map<string, { category: StoreCategoryDto; count: number }>();
    for (const store of allStores) {
      const catName = store.category ?? 'Autre';
      const catId = store.categoryId ?? 'other';
      if (!map.has(catId)) {
        const cat = categoriesQ.data?.find((c) => c.id === catId) ?? { id: catId, code: null, name: catName };
        map.set(catId, { category: cat, count: 0 });
      }
      map.get(catId)!.count++;
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [allStores, categoriesQ.data]);

  const externalPartnersQ = useQuery({
    queryKey: ['myPromoCodeExternalPartners'],
    queryFn: () => promoCodesApi.getExternalPartners(),
    select: (res) => res.data ?? [],
    enabled: isPromoView && showAssignPartnerModal,
    staleTime: 5 * 60 * 1000,
  });
  const partnerOptions = useMemo(() => {
    const data = externalPartnersQ.data ?? [];
    return data.map((p, idx) => ({
      key: `${(p as any).externalPartnerId ?? (p as any).externalPartnerID ?? (p as any).id ?? 'no-ext'}:${p.name ?? (p as any).displayName ?? idx}`,
      externalPartnerId:
        (p as any).externalPartnerId ??
        (p as any).externalPartnerID ??
        (p as any).id ??
        null,
      name: (p as any).name ?? (p as any).displayName ?? 'Partenaire',
    }));
  }, [externalPartnersQ.data]);

  // Quand la modale s'ouvre et que la liste arrive, sélectionner le 1er partenaire par défaut
  useEffect(() => {
    if (!showAssignPartnerModal) return;
    if (selectedAssignExternalPartnerId) return;
    const firstValid = partnerOptions.find((p) => !!p.externalPartnerId) ?? partnerOptions[0];
    if (!firstValid) return;
    setSelectedAssignPartnerKey(firstValid.key);
    setSelectedAssignExternalPartnerId(firstValid.externalPartnerId ?? null);
    setSelectedAssignPartnerName(firstValid.name);
  }, [showAssignPartnerModal, partnerOptions, selectedAssignExternalPartnerId]);

  // ── Fetch add-on subscriptions (Shotgun, Sunbed…) ──
  const addonSubsQ = useQuery({
    queryKey: ['myAddonSubscriptions'],
    queryFn: () => subscriptionsApi.getMyAddonSubscriptions(),
    select: (res) => res.data ?? [],
    staleTime: 0,
    refetchOnMount: true,
  });
  const addonSubs = addonSubsQ.data ?? [];

  // ── Fetch promo codes (only if at least one addon active) ──
  const promoCodesQ = useQuery({
    queryKey: ['myPromoCodes'],
    queryFn: () => promoCodesApi.getMyPromoCodes(),
    select: (res) => res.data ?? [],
    enabled: isPromoView,
    staleTime: 0,
    refetchOnMount: true,
    // Garde l'ancienne liste pendant le refetch (évite l'écran vide)
    placeholderData: (prev) => prev ?? [],
  });
  const promoCodes: PartnerPromoCodeDto[] = promoCodesQ.data ?? [];

  const openFirstPartnerGroupToShow = (codes?: PartnerPromoCodeDto[]) => {
    const source = codes ?? promoCodesQ.data ?? [];
    const available = source.filter((c) => !c.isUsed);
    const used = source.filter((c) => c.isUsed);

    const pick = (arr: PartnerPromoCodeDto[], prefix: 'avail' | 'used') => {
      if (arr.length === 0) return;
      const partners = new Set(
        arr.map((c) => (c.partnerName ?? 'Partenaire').trim() || 'Partenaire'),
      );
      const firstPartnerName = Array.from(partners).sort((a, b) => a.localeCompare(b))[0];
      if (!firstPartnerName) return;
      setOpenPartnerGroupKeys(new Set([`${prefix}:${firstPartnerName}`]));
      promoScrollRef.current?.scrollTo?.({ y: 0, animated: true });
    };

    // Priorité: afficher d'abord les dispo, sinon afficher les utilisés
    pick(available, 'avail');
    pick(used, 'used');
  };

  const openPartnerGroupForPartnerName = (codes: PartnerPromoCodeDto[], partnerName: string) => {
    const pn = (partnerName ?? '').trim() || 'Partenaire';
    const avail = codes.filter((c) => (c.partnerName ?? 'Partenaire').trim() === pn && !c.isUsed);
    const used = codes.filter((c) => (c.partnerName ?? 'Partenaire').trim() === pn && c.isUsed);

    if (avail.length > 0) {
      setOpenPartnerGroupKeys(new Set([`avail:${pn}`]));
      promoScrollRef.current?.scrollTo?.({ y: 0, animated: true });
      return;
    }
    if (used.length > 0) {
      setOpenPartnerGroupKeys(new Set([`used:${pn}`]));
      promoScrollRef.current?.scrollTo?.({ y: 0, animated: true });
      return;
    }
    // Si le partenaire n'a encore rien, on ouvre aucune section.
    setOpenPartnerGroupKeys(new Set());
  };

  // ── Mark promo code as used ──
  const markUsedMutation = useMutation({
    mutationFn: (id: string) => promoCodesApi.markUsed(id),
    onSuccess: async () => {
      // mark-used retourne 204 → il faut refetch la liste pour refléter le changement
      const res = await promoCodesQ.refetch();
      const freshCodes = (res.data ?? promoCodesQ.data ?? []) as PartnerPromoCodeDto[];
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowRequestAnotherCode(true);
      // Déplie automatiquement le prochain partenaire avec des codes dispo
      openFirstPartnerGroupToShow(freshCodes);
    },
  });

  // ── Assign next promo code by partner (nouveau endpoint) ──
  const assignByPartnerMutation = useMutation({
    mutationFn: (vars: { externalPartnerId: string; partnerName?: string | null }) =>
      promoCodesApi.assignByPartner(vars.externalPartnerId),
    onSuccess: async (_res, vars) => {
      const partnerName = (vars.partnerName ?? selectedAssignPartnerName ?? '').trim();

      // Le backend peut renvoyer une shape différente; on se resynchronise via GET.
      const ref = await promoCodesQ.refetch();
      const freshCodes = (ref.data ?? promoCodesQ.data ?? []) as PartnerPromoCodeDto[];

      if (partnerName) {
        openPartnerGroupForPartnerName(freshCodes, partnerName);
      } else {
        openFirstPartnerGroupToShow(freshCodes);
      }

      const newest = freshCodes
        .filter((c) => !c.isUsed)
        .filter((c) => (partnerName ? (c.partnerName ?? '').trim() === partnerName : true))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      const newestFallback = !newest?.code
        ? freshCodes
            .filter((c) => !c.isUsed)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        : null;
      const newestToReveal = newest ?? newestFallback;

      if (newestToReveal?.partnerName) {
        openPartnerGroupForPartnerName(freshCodes, (newestToReveal.partnerName ?? '').trim());
      }

      if (newestToReveal?.code) {
        const codeKey = getPromoCodeKey(newestToReveal);
        setRevealedCodeKeys((prev) => {
          const next = new Set(prev);
          next.add(codeKey);
          return next;
        });

        Alert.alert(
          'Nouveau code attribué',
          newestToReveal.code,
          [
            { text: 'Fermer', style: 'cancel' },
            {
              text: 'Copier',
              onPress: async () => {
                await Clipboard.setStringAsync(newestToReveal.code);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              },
            },
          ],
        );
      }

      setShowAssignPartnerModal(false);
      setSelectedAssignPartnerKey(null);
      setSelectedAssignExternalPartnerId(null);
      setSelectedAssignPartnerName(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: any) => {
      Alert.alert('Erreur', err?.response?.data?.detail ?? err?.message ?? 'Impossible d’assigner un code.');
    },
  });

  const handleCopyCode = async (code: PartnerPromoCodeDto) => {
    await Clipboard.setStringAsync(code.code);
    setCopiedCodeKey(getPromoCodeKey(code));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  setTimeout(() => setCopiedCodeKey(null), 2000);
  };

  const handleMarkUsed = (code: PartnerPromoCodeDto) => {
    if (code.isUsed) return;
    const promoCodeId = getPromoCodeId(code);
    if (!promoCodeId) {
      Alert.alert('Erreur', 'Identifiant du code promo introuvable.');
      return;
    }
    Alert.alert(
      'Marquer comme utilisé',
      `Confirmer l'utilisation du code "${code.code}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => markUsedMutation.mutate(promoCodeId),
        },
      ],
    );
  };

  const openPromoCodes = () => {
    setIsPromoView(true);
    setSelectedCategory(null);
  };

  const navigateToStore = useCallback(
    (id: string) => router.push({ pathname: '/(client)/partner-details', params: { id } }),
    [router],
  );

  const isRefreshing = storesQ.isRefetching && !storesQ.isFetchingNextPage;
  const onRefresh = () => { storesQ.refetch(); categoriesQ.refetch(); };

  const listRef = useRef<FlatList>(null);
  const promoScrollRef = useRef<ScrollView>(null);

  const goToPage = (p: number) => {
    setCurrentPage(p);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  // ── Grid card ──
  const renderGridCard = useCallback(
    ({ item }: { item: StoreDto }) => (
      <TouchableOpacity
        style={styles.gridCard}
        activeOpacity={0.85}
        onPress={() => navigateToStore(item.id)}
      >
        <StoreImage store={item} style={styles.gridCardImage} />
        <View style={styles.gridCardBody}>
          <Text style={styles.gridCardName} numberOfLines={1}>
            {item.name || item.partnerName || 'Partenaire'}
          </Text>
          <Text style={styles.gridCardCity} numberOfLines={1}>{item.city || ''}</Text>
          {item.avgDiscountPercent > 0 && (
            <MBadge
              label={`-${Math.round(item.avgDiscountPercent)}%`}
              variant="orange"
              size="sm"
              style={{ marginTop: spacing[1], alignSelf: 'flex-start' }}
            />
          )}
        </View>
      </TouchableOpacity>
    ),
    [navigateToStore],
  );

  const isAddonView = isPromoView;

  const filteredPromoCodes = useMemo(() => {
    if (!isAddonView) return promoCodes;
    return promoCodes;
  }, [promoCodes, isAddonView]);

  const availablePromoCodes = useMemo(
    () => filteredPromoCodes.filter((c) => !c.isUsed),
    [filteredPromoCodes],
  );
  const usedPromoCodes = useMemo(
    () => filteredPromoCodes.filter((c) => c.isUsed),
    [filteredPromoCodes],
  );

  const matchedPromoCodesCount = availablePromoCodes.length + usedPromoCodes.length;
  const hasUsedPromoCodes = usedPromoCodes.length > 0;

  const groupByPartner = (codes: PartnerPromoCodeDto[]) => {
    const map = new Map<string, PartnerPromoCodeDto[]>();
    for (const c of codes) {
      const key = (c.partnerName ?? 'Partenaire').trim() || 'Partenaire';
      const existing = map.get(key) ?? [];
      existing.push(c);
      map.set(key, existing);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([partnerName, items]) => ({ partnerName, items }));
  };

  const availableGroups = useMemo(() => groupByPartner(availablePromoCodes), [availablePromoCodes]);
  const usedGroups = useMemo(() => groupByPartner(usedPromoCodes), [usedPromoCodes]);

  const togglePartnerGroup = (groupKey: string) => {
    setOpenPartnerGroupKeys((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Partenaires</Text>
          <Text style={styles.subtitle}>
            {isAddonView
              ? `${matchedPromoCodesCount} code${matchedPromoCodesCount !== 1 ? 's' : ''} disponible${matchedPromoCodesCount !== 1 ? 's' : ''}`
              : `${filteredStores.length} résultat${filteredStores.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(client)/stores-map')} style={styles.mapBtn}>
          <Ionicons name="map-outline" size={wp(20)} color={colors.orange[500]} />
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      {!isAddonView && (
        <View style={styles.searchWrap}>
          <MSearchBar
            value={search}
            onChangeText={(text: string) => { setSearch(text); if (selectedCategory) setSelectedCategory(null); }}
            placeholder="Rechercher un partenaire, une ville…"
          />
        </View>
      )}

      {/* ── Filters bar (categories + addon pills) ── */}
      <View style={styles.filtersWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
          {/* "Tous" */}
          <TouchableOpacity
            style={[styles.filterPill, !selectedCategory && !isAddonView && styles.filterPillActive]}
            onPress={() => { setSelectedCategory(null); setIsPromoView(false); }}
            activeOpacity={0.8}
          >
            {!selectedCategory && !isAddonView ? (
              <LinearGradient colors={[...colors.gradients.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.filterPillGradient}>
                <Ionicons name="grid-outline" size={wp(14)} color="#FFF" />
                <Text style={styles.filterPillTextActive}>Tous</Text>
                <View style={styles.filterCount}><Text style={styles.filterCountText}>{allStores.length}</Text></View>
              </LinearGradient>
            ) : (
              <>
                <Ionicons name="grid-outline" size={wp(14)} color={colors.neutral[400]} />
                <Text style={styles.filterPillText}>Tous</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Category pills */}
          {storesByCategory.map(({ category: cat, count }) => {
            const isActive = selectedCategory === cat.id && !isAddonView;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => { setSelectedCategory(isActive ? null : cat.id); setIsPromoView(false); }}
                activeOpacity={0.8}
              >
                {isActive ? (
                  <LinearGradient colors={[...colors.gradients.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.filterPillGradient}>
                    <Text style={styles.filterPillTextActive}>{cat.name || cat.code || 'Autre'}</Text>
                    <View style={styles.filterCount}><Text style={styles.filterCountText}>{count}</Text></View>
                  </LinearGradient>
                ) : (
                  <>
                    <Text style={styles.filterPillText}>{cat.name || cat.code || 'Autre'}</Text>
                    <View style={styles.filterCountInactive}><Text style={styles.filterCountTextInactive}>{count}</Text></View>
                  </>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Codes promo (unique) */}
          {addonSubs.length > 0 && (
            <>
              <View style={styles.filterPillDivider} />
              <TouchableOpacity
                style={[styles.filterPill, styles.filterPillAddon, isAddonView && styles.filterPillAddonActive]}
                onPress={openPromoCodes}
                activeOpacity={0.8}
              >
                {isAddonView ? (
                  <LinearGradient
                    colors={[colors.orange[500], colors.orange[700]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.filterPillGradient}
                  >
                    <Ionicons name="pricetags" size={wp(13)} color="#FFF" />
                    <Text style={styles.filterPillTextActive}>Codes promo</Text>
                  </LinearGradient>
                ) : (
                  <>
                    <Ionicons name="pricetags-outline" size={wp(13)} color={colors.orange[500]} />
                    <Text style={[styles.filterPillText, { color: colors.orange[500] }]}>Codes promo</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>

      {/* ── Promo codes view (when addon pill selected) ── */}
      {isAddonView ? (
        <ScrollView
          ref={promoScrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={[styles.promoScrollContent, { paddingBottom: insets.bottom + wp(100) }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Addon header banner */}
          <LinearGradient
            colors={[colors.orange[500], colors.orange[700]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.promoBanner}
          >
            <View style={styles.promoBannerIcon}>
              <Ionicons name="pricetag" size={wp(28)} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.promoBannerTitle}>Codes promo</Text>
              <Text style={styles.promoBannerSub}>Vos codes de réduction par partenaire</Text>
            </View>
          </LinearGradient>

          {/* Request another code CTA
              - on ne génère rien automatiquement
              - visible uniquement si au moins 1 code a déjà été utilisé
          */}
          {hasUsedPromoCodes && !promoCodesQ.isLoading && !promoCodesQ.isError && (
            <View style={styles.requestAnotherBox}>
              <Text style={styles.requestAnotherText}>
                Besoin d’un autre code ? Choisissez le partenaire.
              </Text>
              <TouchableOpacity
                style={styles.requestAnotherBtn}
                activeOpacity={0.85}
                onPress={() => {
                  const defaultPartner = partnerOptions.find((p) => !!p.externalPartnerId) ?? partnerOptions[0] ?? null;
                  setSelectedAssignPartnerKey(defaultPartner?.key ?? null);
                  setSelectedAssignExternalPartnerId(defaultPartner?.externalPartnerId ?? null);
                  setSelectedAssignPartnerName(defaultPartner?.name ?? null);
                  setShowAssignPartnerModal(true);
                }}
              >
                <Text style={styles.requestAnotherBtnText}>
                  Demander
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Assign by partner modal */}
          <Modal
            visible={showAssignPartnerModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowAssignPartnerModal(false)}
          >
            <View style={styles.assignModalOverlay}>
              <View style={styles.assignModalCard}>
                <Text style={styles.assignModalTitle}>Choisir un partenaire</Text>

                <View style={{ maxHeight: wp(400) as any }}>
                  {externalPartnersQ.isLoading && (
                    <Text style={styles.assignLoadingText}>Chargement des partenaires…</Text>
                  )}
                  {!externalPartnersQ.isLoading && partnerOptions.length === 0 && (
                    <Text style={styles.assignLoadingText}>Aucun partenaire disponible.</Text>
                  )}
                  {partnerOptions.map((item, idx) => {
                    const key = item.key;
                    const active = selectedAssignPartnerKey === item.key;
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[styles.assignPartnerItem, active && styles.assignPartnerItemActive]}
                        onPress={() => {
                          setSelectedAssignPartnerKey(item.key);
                          setSelectedAssignExternalPartnerId(item.externalPartnerId ?? null);
                          setSelectedAssignPartnerName(item.name);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.assignPartnerItemText, active && styles.assignPartnerItemTextActive]}>
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.assignModalActions}>
                  <TouchableOpacity
                    style={[styles.assignActionBtn, styles.assignActionBtnOutline]}
                    onPress={() => setShowAssignPartnerModal(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.assignActionBtnText, styles.assignActionBtnTextOutline]}>Annuler</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.assignActionBtn, styles.assignActionBtnPrimary]}
                    onPress={() => {
                      if (!selectedAssignExternalPartnerId) return;
                      setShowRequestAnotherCode(false);
                      assignByPartnerMutation.mutate({
                        externalPartnerId: selectedAssignExternalPartnerId,
                        partnerName: selectedAssignPartnerName,
                      } as any);
                    }}
                    activeOpacity={0.85}
                    disabled={!selectedAssignExternalPartnerId || assignByPartnerMutation.isPending}
                  >
                    <Text style={styles.assignActionBtnTextPrimary}>
                      {assignByPartnerMutation.isPending ? 'Assignation…' : 'Obtenir code'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Promo codes list */}
          {promoCodesQ.isLoading ? (
            <LoadingSpinner message="Chargement des codes…" />
          ) : promoCodesQ.isError ? (
            <View style={styles.promoEmptyBox}>
              <Ionicons name="alert-circle-outline" size={wp(36)} color="#EF4444" />
              <Text style={styles.promoEmptyTitle}>Erreur de chargement</Text>
              <Text style={styles.promoEmptyDesc}>Impossible de récupérer vos codes.</Text>
            </View>
          ) : matchedPromoCodesCount === 0 ? (
            <View style={styles.promoEmptyBox}>
              <Ionicons name="pricetag-outline" size={wp(36)} color={colors.neutral[300]} />
              <Text style={styles.promoEmptyTitle}>Aucun code disponible</Text>
              <Text style={styles.promoEmptyDesc}>
                {hasUsedPromoCodes
                  ? "Tous vos codes ont été utilisés. Appuyez sur « Demander » pour rafraîchir."
                  : "Vos codes apparaîtront ici après activation."}
              </Text>
            </View>
          ) : (
            <>
              {/* Available codes */}
              {availablePromoCodes.length > 0 && (
                <Text style={styles.promoGroupLabel}>Disponibles</Text>
              )}
              {availableGroups.map(({ partnerName, items }, groupIdx) => {
                const groupKey = `avail:${partnerName}`;
                const isOpen = openPartnerGroupKeys.has(groupKey);

                return (
                  <View key={groupKey} style={{ gap: spacing[2] }}>
                    <TouchableOpacity
                      style={styles.partnerGroupHeader}
                      activeOpacity={0.8}
                      onPress={() => togglePartnerGroup(groupKey)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.partnerGroupTitle}>{partnerName}</Text>
                        <Text style={styles.partnerGroupSub}>{items.length} code{items.length !== 1 ? 's' : ''}</Text>
                      </View>
                      <Ionicons
                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                        size={wp(18)}
                        color={isOpen ? colors.orange[500] : colors.neutral[400]}
                      />
                    </TouchableOpacity>

                    {isOpen && (
                      <>
                        {items.map((code) => {
                          const codeKey = getPromoCodeKey(code);
                          const isRevealed = revealedCodeKeys.has(codeKey);
                          return (
                            <View key={codeKey} style={styles.promoCard}>
                              {/* Top row */}
                              <View style={styles.promoCardTop}>
                                <View style={{ flex: 1 }}>
                                  {(code.discountPercent ?? 0) > 0 && (
                                    <Text style={styles.promoCardDiscount}>-{code.discountPercent}% de réduction</Text>
                                  )}
                                  {code.description ? (
                                    <Text style={styles.promoCardDesc} numberOfLines={2}>{code.description}</Text>
                                  ) : null}
                                </View>
                                {(code.discountPercent ?? 0) > 0 && (
                                  <View style={styles.promoDiscountBubble}>
                                    <Text style={styles.promoDiscountBubbleText}>-{code.discountPercent}%</Text>
                                  </View>
                                )}
                              </View>

                              {/* Code box */}
                              <TouchableOpacity
                                style={styles.promoCodeBox}
                                activeOpacity={0.9}
                                onPress={() => toggleRevealCode(codeKey)}
                              >
                                <View style={styles.promoCodeBoxInner}>
                                  <Text style={[styles.promoCodeText, !isRevealed && styles.promoCodeTextHidden]}>
                                    {isRevealed ? code.code : maskPromoCode(code.code)}
                                  </Text>
                                  <View style={styles.promoRevealRow}>
                                    <Ionicons
                                      name={isRevealed ? 'eye-off-outline' : 'eye-outline'}
                                      size={wp(14)}
                                      color={isRevealed ? colors.orange[500] : colors.neutral[400]}
                                    />
                                    <Text style={[styles.promoRevealText, !isRevealed && styles.promoRevealTextHidden]}>
                                      {isRevealed ? 'Cacher' : 'Dévoiler'}
                                    </Text>
                                  </View>
                                </View>
                              </TouchableOpacity>

                              {/* Actions */}
                              <View style={styles.promoCardActions}>
                                <TouchableOpacity
                                  style={styles.promoCopyBtn}
                                  onPress={() => handleCopyCode(code)}
                                  activeOpacity={0.8}
                                >
                                  <LinearGradient
                                    colors={
                                      copiedCodeKey === codeKey
                                        ? ['#22C55E', '#16A34A']
                                        : [colors.orange[500], colors.orange[700]]
                                    }
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={styles.promoCopyGradient}
                                  >
                                    <Ionicons
                                      name={copiedCodeKey === codeKey ? 'checkmark' : 'copy-outline'}
                                      size={wp(16)}
                                      color="#FFF"
                                    />
                                    <Text style={styles.promoCopyText}>
                                      {copiedCodeKey === codeKey ? 'Copié !' : 'Copier le code'}
                                    </Text>
                                  </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={styles.promoUsedBtn}
                                  onPress={() => handleMarkUsed(code)}
                                  activeOpacity={0.7}
                                >
                                  <Ionicons name="checkmark-circle-outline" size={wp(15)} color={colors.neutral[400]} />
                                  <Text style={styles.promoUsedBtnText}>Marquer utilisé</Text>
                                </TouchableOpacity>
                              </View>

                              {/* Expiry */}
                              {code.expiresAt && (
                                <Text style={styles.promoExpiry}>
                                  Expire le {new Date(code.expiresAt).toLocaleDateString('fr-FR')}
                                </Text>
                              )}
                            </View>
                          );
                        })}
                      </>
                    )}
                  </View>
                );
              })}

              {/* Used codes */}
              {usedPromoCodes.length > 0 && (
                <>
                  <Text style={[styles.promoGroupLabel, { marginTop: spacing[4] }]}>Utilisés</Text>
                  {usedGroups.map(({ partnerName, items }, groupIdx) => {
                    const groupKey = `used:${partnerName}`;
                    const isOpen = openPartnerGroupKeys.has(groupKey);

                    return (
                      <View key={groupKey} style={{ gap: spacing[2] }}>
                        <TouchableOpacity
                          style={styles.partnerGroupHeaderUsed}
                          activeOpacity={0.8}
                          onPress={() => togglePartnerGroup(groupKey)}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.partnerGroupTitle, { color: colors.neutral[300] }]}>{partnerName}</Text>
                            <Text style={styles.partnerGroupSubUsed}>{items.length} code{items.length !== 1 ? 's' : ''}</Text>
                          </View>
                          <Ionicons
                            name={isOpen ? 'chevron-up' : 'chevron-down'}
                            size={wp(18)}
                            color={isOpen ? colors.neutral[300] : colors.neutral[500]}
                          />
                        </TouchableOpacity>

                        {isOpen && (
                          <>
                            {items.map((code) => {
                              const codeKey = getPromoCodeKey(code);
                              const isRevealed = revealedCodeKeys.has(codeKey);
                              return (
                                <View key={codeKey} style={[styles.promoCard, styles.promoCardUsed]}>
                                  <View style={styles.promoCardTop}>
                                    <View style={{ flex: 1 }}>
                                      <Text style={[styles.promoCardPartner, { color: colors.neutral[400] }]}>{partnerName}</Text>
                                    </View>
                                    <View style={styles.promoUsedBadge}>
                                      <Ionicons name="checkmark-circle" size={wp(14)} color={colors.neutral[400]} />
                                      <Text style={styles.promoUsedText}>Utilisé</Text>
                                    </View>
                                  </View>

                                  <TouchableOpacity
                                    style={[styles.promoCodeBox, styles.promoCodeBoxUsed]}
                                    activeOpacity={0.9}
                                    onPress={() => toggleRevealCode(codeKey)}
                                  >
                                    <View style={styles.promoCodeBoxInner}>
                                      <Text style={[styles.promoCodeText, styles.promoCodeTextUsed]}>
                                        {isRevealed ? code.code : maskPromoCode(code.code)}
                                      </Text>
                                      <View style={styles.promoRevealRow}>
                                        <Ionicons
                                          name={isRevealed ? 'eye-off-outline' : 'eye-outline'}
                                          size={wp(14)}
                                          color={colors.neutral[400]}
                                        />
                                        <Text style={[styles.promoRevealText, { color: colors.neutral[400] }]}>
                                          {isRevealed ? 'Cacher' : 'Dévoiler'}
                                        </Text>
                                      </View>
                                    </View>
                                  </TouchableOpacity>
                                </View>
                              );
                            })}
                          </>
                        )}
                      </View>
                    );
                  })}
                </>
              )}
            </>
          )}
        </ScrollView>
      ) : (
        /* ── Store grid ── */
        storesQ.isLoading ? (
          <LoadingSpinner fullScreen message="Chargement des partenaires…" />
        ) : storesQ.isError ? (
          <ErrorState
            fullScreen
            title="Erreur de chargement"
            description="Impossible de charger les partenaires."
            onRetry={onRefresh}
            icon="storefront-outline"
          />
        ) : (
          <FlatList
            ref={listRef}
            data={pageItems}
            numColumns={2}
            renderItem={renderGridCard}
            keyExtractor={(item) => item.id}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={[styles.gridList, { paddingBottom: insets.bottom + wp(100) }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.orange[500]} />
            }
            ListEmptyComponent={
              <EmptyState
                icon="storefront-outline"
                title="Aucun partenaire trouvé"
                description="Essayez une autre recherche ou explorez la carte."
                actionLabel="Voir la carte"
                onAction={() => router.push('/(client)/stores-map')}
              />
            }
            ListFooterComponent={
              filteredStores.length > 0 ? (
                <View style={styles.paginationWrap}>
                  <Text style={styles.pageInfo}>
                    Page {safePage} / {totalPages}
                    {'  ·  '}
                    {(safePage - 1) * PER_PAGE + 1}–{Math.min(safePage * PER_PAGE, filteredStores.length)} sur {filteredStores.length}
                  </Text>
                  <PageNav page={safePage} total={totalPages} onChange={goToPage} />
                </View>
              ) : null
            }
          />
        )
      )}
    </View>
  );
}

/* ── Page nav styles ── */
const pnStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  chevron: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(18),
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  chevronDisabled: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[100],
  },
  pill: {
    minWidth: wp(36),
    height: wp(36),
    borderRadius: wp(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
  },
  pillActive: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  pillGradient: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: wp(13),
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[600],
  },
  pillTextActive: {
    fontSize: wp(13),
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  dots: {
    fontSize: wp(14),
    fontFamily: fontFamily.medium,
    color: colors.neutral[400],
    paddingHorizontal: spacing[1],
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[3],
    paddingBottom: spacing[1],
  },
  title: { ...textStyles.h2, color: colors.neutral[900] },
  subtitle: { ...textStyles.micro, color: colors.neutral[500], marginTop: spacing[1] },
  mapBtn: {
    width: wp(44), height: wp(44), borderRadius: wp(22),
    backgroundColor: colors.orange[50], alignItems: 'center', justifyContent: 'center', ...shadows.sm,
  },
  searchWrap: { paddingHorizontal: spacing[6], paddingVertical: spacing[2] },

  /* Filters */
  filtersWrap: { marginBottom: spacing[3] },
  filtersContainer: { paddingHorizontal: spacing[6], gap: spacing[2], alignItems: 'center' },
  filterPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing[4], paddingVertical: spacing[2],
    borderRadius: borderRadius.full, backgroundColor: '#1E293B',
    borderWidth: 1, borderColor: colors.neutral[200], gap: spacing[2], ...shadows.sm,
  },
  filterPillActive: { borderWidth: 0, paddingHorizontal: 0, paddingVertical: 0, backgroundColor: 'transparent', overflow: 'hidden' },
  filterPillGradient: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing[4], paddingVertical: spacing[2],
    borderRadius: borderRadius.full, gap: spacing[2],
  },
  filterPillText: { ...textStyles.caption, fontFamily: fontFamily.medium, color: colors.neutral[700] },
  filterPillTextActive: {
    ...textStyles.caption,
    fontFamily: fontFamily.bold,
    fontSize: wp(13),
    color: '#FFFFFF',
  },
  filterCount: {
    backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: wp(10),
    minWidth: wp(20), height: wp(20), alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[1],
  },
  filterCountText: { ...textStyles.micro, fontFamily: fontFamily.bold, color: '#FFFFFF', fontSize: wp(10) },
  filterCountInactive: {
    backgroundColor: colors.neutral[100], borderRadius: wp(10),
    minWidth: wp(20), height: wp(20), alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[1],
  },
  filterCountTextInactive: { ...textStyles.micro, fontFamily: fontFamily.bold, color: colors.neutral[500], fontSize: wp(10) },

  /* Addon pill variant */
  filterPillAddon: {
    borderColor: '#FFE4CC',
    backgroundColor: '#FFF7F0',
  },
  filterPillAddonActive: {
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  filterPillDivider: {
    width: 1,
    height: wp(24),
    backgroundColor: colors.neutral[200],
    alignSelf: 'center',
    marginHorizontal: spacing[1],
  },

  /* Promo codes full view */
  promoScrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    gap: spacing[3],
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    gap: spacing[3],
    marginBottom: spacing[1],
  },
  promoBannerIcon: {
    width: wp(50),
    height: wp(50),
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoBannerTitle: {
    ...textStyles.h4,
    color: '#FFFFFF',
    fontFamily: fontFamily.bold,
  },
  promoBannerSub: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  promoGroupLabel: {
    ...textStyles.caption,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing[1],
  },
  promoEmptyBox: {
    alignItems: 'center',
    paddingVertical: spacing[10],
    gap: spacing[3],
  },
  promoEmptyTitle: {
    ...textStyles.h5,
    color: colors.neutral[700],
  },
  promoEmptyDesc: {
    ...textStyles.caption,
    color: colors.neutral[400],
    textAlign: 'center',
  },
  promoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.orange[100],
    ...shadows.sm,
  },
  promoCardUsed: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[200],
    opacity: 0.75,
  },
  promoCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  promoCardPartner: {
    ...textStyles.body,
    fontFamily: fontFamily.bold,
    color: colors.neutral[900],
  },
  promoCardDiscount: {
    ...textStyles.caption,
    color: colors.orange[500],
    fontFamily: fontFamily.medium,
    marginTop: 2,
  },
  promoCardDesc: {
    ...textStyles.micro,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  promoDiscountBubble: {
    width: wp(50),
    height: wp(50),
    borderRadius: wp(25),
    backgroundColor: colors.orange[50],
    borderWidth: 2,
    borderColor: colors.orange[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoDiscountBubbleText: {
    ...textStyles.caption,
    fontFamily: fontFamily.bold,
    color: colors.orange[600],
  },
  promoCodeBox: {
    borderWidth: 1.5,
    borderColor: '#FFBC85',
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    alignItems: 'center',
    backgroundColor: '#FFF7F0',
  },
  promoCodeBoxInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
  },
  promoCodeBoxUsed: {
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[100],
  },
  promoCodeText: {
    fontSize: wp(20),
    fontFamily: fontFamily.bold,
    color: colors.neutral[50], // Fond clair (#FFF7F0) => texte sombre pour un bon contraste
    letterSpacing: 3,
  },
  promoCodeTextHidden: {
    color: colors.neutral[400],
  },
  promoCodeTextUsed: {
    color: colors.neutral[400],
    textDecorationLine: 'line-through',
    letterSpacing: 1,
  },
  promoRevealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  promoRevealText: {
    ...textStyles.caption,
    fontFamily: fontFamily.bold,
    color: colors.orange[500],
  },
  promoRevealTextHidden: {
    color: colors.neutral[400],
  },

  partnerGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: spacing[1],
  },
  partnerGroupHeaderUsed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: spacing[1],
  },
  partnerGroupTitle: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[0],
    marginBottom: 2,
  },
  partnerGroupSub: {
    ...textStyles.caption,
    color: colors.neutral[400],
  },
  partnerGroupSubUsed: {
    ...textStyles.caption,
    color: colors.neutral[500],
  },

  requestAnotherBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,106,0,0.25)',
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
    marginBottom: spacing[1],
  },
  requestAnotherText: {
    ...textStyles.caption,
    color: colors.neutral[400],
    flex: 1,
    lineHeight: 18,
  },
  requestAnotherBtn: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.orange[500],
  },
  requestAnotherBtnText: {
    ...textStyles.caption,
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },

  assignModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
  },
  assignModalCard: {
    width: '100%',
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: spacing[4],
    gap: spacing[3],
    maxHeight: '80%',
  },
  assignModalTitle: {
    ...textStyles.body,
    fontFamily: fontFamily.bold,
    color: colors.neutral[0],
    fontSize: wp(14),
  },
  assignLoadingText: {
    ...textStyles.caption,
    color: colors.neutral[400],
    marginBottom: spacing[2],
  },
  assignPartnerItem: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  assignPartnerItemActive: {
    borderColor: 'rgba(255,106,0,0.5)',
    backgroundColor: 'rgba(255,106,0,0.12)',
  },
  assignPartnerItemText: {
    ...textStyles.caption,
    fontFamily: fontFamily.medium,
    color: colors.neutral[200],
  },
  assignPartnerItemTextActive: {
    color: '#FFFFFF',
    fontFamily: fontFamily.semiBold,
  },
  assignModalActions: {
    flexDirection: 'row',
    gap: spacing[3],
    justifyContent: 'space-between',
  },
  assignActionBtn: {
    flex: 1,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignActionBtnOutline: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  assignActionBtnPrimary: {
    backgroundColor: colors.orange[500],
  },
  assignActionBtnText: {
    ...textStyles.caption,
    fontFamily: fontFamily.semiBold,
  },
  assignActionBtnTextOutline: {
    color: colors.neutral[300],
  },
  assignActionBtnTextPrimary: {
    ...textStyles.caption,
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },
  promoCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  promoCopyBtn: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  promoCopyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  promoCopyText: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },
  promoUsedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
  },
  promoUsedBtnText: {
    ...textStyles.caption,
    color: colors.neutral[400],
    fontFamily: fontFamily.medium,
  },
  promoExpiry: {
    ...textStyles.micro,
    color: colors.neutral[400],
    textAlign: 'right',
  },
  promoUsedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  promoUsedText: {
    ...textStyles.micro,
    color: colors.neutral[500],
    fontFamily: fontFamily.medium,
  },

  /* Grid */
  gridList: { paddingHorizontal: spacing[6] },
  gridRow: { justifyContent: 'space-between', marginBottom: spacing[3] },
  gridCard: { width: CARD_WIDTH, backgroundColor: '#1E293B', borderRadius: borderRadius.xl, overflow: 'hidden', ...shadows.sm },
  gridCardImage: { width: CARD_WIDTH, height: CARD_WIDTH * 0.65, resizeMode: 'cover', backgroundColor: colors.neutral[100] },
  gridCardBody: { padding: spacing[3] },
  gridCardName: { ...textStyles.body, fontFamily: fontFamily.semiBold, color: colors.neutral[900] },
  gridCardCity: { ...textStyles.micro, color: colors.neutral[500], marginTop: spacing[1] },

  /* Pagination */
  paginationWrap: {
    paddingVertical: spacing[5],
    alignItems: 'center',
    gap: spacing[3],
  },
  pageInfo: {
    fontSize: wp(11),
    fontFamily: fontFamily.medium,
    color: colors.neutral[400],
  },
});
