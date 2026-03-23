/**
 * Maya Connect V2 — Partners List Screen
 * Pagination client-side — grid 2 colonnes + navigateur de pages
 */
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storesApi } from '../../src/api/stores.api';
import { referentielApi } from '../../src/api/referentiel.api';
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
import type { StoreDto, StoreCategoryDto } from '../../src/types';

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
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearch = useDebounced(search, 400);

  // Reset page quand le filtre/recherche change
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, selectedCategory]);

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

  const navigateToStore = useCallback(
    (id: string) => router.push({ pathname: '/(client)/partner-details', params: { id } }),
    [router],
  );

  const isRefreshing = storesQ.isRefetching && !storesQ.isFetchingNextPage;
  const onRefresh = () => { storesQ.refetch(); categoriesQ.refetch(); };

  const listRef = useRef<FlatList>(null);

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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Partenaires</Text>
          <Text style={styles.subtitle}>
            {filteredStores.length} résultat{filteredStores.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(client)/stores-map')} style={styles.mapBtn}>
          <Ionicons name="map-outline" size={wp(20)} color={colors.orange[500]} />
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchWrap}>
        <MSearchBar
          value={search}
          onChangeText={(text: string) => { setSearch(text); if (selectedCategory) setSelectedCategory(null); }}
          placeholder="Rechercher un partenaire, une ville…"
        />
      </View>

      {/* ── Category Filters ── */}
      {storesByCategory.length > 0 && (
        <View style={styles.filtersWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
            {/* "Tous" */}
            <TouchableOpacity
              style={[styles.filterPill, !selectedCategory && styles.filterPillActive]}
              onPress={() => setSelectedCategory(null)}
              activeOpacity={0.8}
            >
              {!selectedCategory ? (
                <LinearGradient colors={[...colors.gradients.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.filterPillGradient}>
                  <Ionicons name="grid-outline" size={wp(14)} color="#FFF" />
                  <Text style={styles.filterPillTextActive}>Tous</Text>
                  <View style={styles.filterCount}><Text style={styles.filterCountText}>{allStores.length}</Text></View>
                </LinearGradient>
              ) : (
                <>
                  <Ionicons name="grid-outline" size={wp(14)} color={colors.neutral[600]} />
                  <Text style={styles.filterPillText}>Tous</Text>
                </>
              )}
            </TouchableOpacity>

            {storesByCategory.map(({ category: cat, count }) => {
              const isActive = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                  onPress={() => setSelectedCategory(isActive ? null : cat.id)}
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
          </ScrollView>
        </View>
      )}

      {/* ── Content ── */}
      {storesQ.isLoading ? (
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
                {/* Info page */}
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
  filterPillTextActive: { ...textStyles.caption, fontFamily: fontFamily.semiBold, color: '#FFFFFF' },
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
