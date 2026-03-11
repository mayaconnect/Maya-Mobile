/**
 * Maya Connect V2 — Partners List Screen
 *
 * Premium Uber Eats–inspired layout:
 *  • Fancy pill category filters with icons & count badges
 *  • Each category shows a horizontal scroll of store cards
 *  • Tapping a category shows a 2-column grid
 *  • Store image fallback: store → partner → Maya default
 */
import React, { useState, useCallback, useMemo } from 'react';
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
  ActivityIndicator,
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
import type { StoreDto, StoreCategoryDto } from '../../src/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - spacing[6] * 2 - spacing[3]) / 2;
const HCARD_WIDTH = wp(160);
const DEFAULT_STORE_IMAGE = require('../../assets/images/centered_logo_gradient.png');

/** Resolve the best image for a store — fallback: store → partner → Maya default */
const getStoreImageSource = (store: StoreDto) => {
  if (store.imageUrl) return { uri: store.imageUrl };
  if (store.partnerImageUrl) return { uri: store.partnerImageUrl };
  return DEFAULT_STORE_IMAGE;
};

export default function PartnersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const debouncedSearch = useDebounced(search, 400);
  const PAGE_SIZE = 60;

  // ── Fetch store categories ──
  const categoriesQ = useQuery({
    queryKey: ['storeCategories'],
    queryFn: () => referentielApi.getStoreCategories(),
    select: (res) => res.data,
    staleTime: 30 * 60 * 1000,
  });

  // ── Fetch all stores ──
  const storesQ = useInfiniteQuery({
    queryKey: ['partners'],
    queryFn: ({ pageParam = 1 }) =>
      storesApi.search({ page: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const data = lastPage.data;
      if (!data?.items) return undefined;
      const loaded = allPages.reduce(
        (sum, p) => sum + (p.data?.items?.length ?? 0),
        0,
      );
      return loaded < (data.totalCount ?? 0) ? allPages.length + 1 : undefined;
    },
  });

  const allStores = useMemo(
    () => storesQ.data?.pages?.flatMap((p) => p.data?.items ?? []) ?? [],
    [storesQ.data],
  );

  // ── Client-side search filter ──
  const filteredStores = useMemo(() => {
    if (!debouncedSearch) return allStores;
    const q = debouncedSearch.toLowerCase();
    return allStores.filter(
      (s: StoreDto) =>
        (s.name ?? '').toLowerCase().includes(q) ||
        (s.partnerName ?? '').toLowerCase().includes(q) ||
        (s.city ?? '').toLowerCase().includes(q) ||
        (s.category ?? '').toLowerCase().includes(q),
    );
  }, [allStores, debouncedSearch]);

  // ── Group stores by category (sorted by store count desc) ──
  const storesByCategory = useMemo(() => {
    const map = new Map<string, { category: StoreCategoryDto; stores: StoreDto[] }>();

    for (const store of filteredStores) {
      const catName = store.category ?? 'Autre';
      const catId = store.categoryId ?? 'other';
      if (!map.has(catId)) {
        const cat = categoriesQ.data?.find((c) => c.id === catId) ?? {
          id: catId,
          code: null,
          name: catName,
        };
        map.set(catId, { category: cat, stores: [] });
      }
      map.get(catId)!.stores.push(store);
    }

    return Array.from(map.values()).sort((a, b) => b.stores.length - a.stores.length);
  }, [filteredStores, categoriesQ.data]);

  const activeCategories = useMemo(
    () => storesByCategory.map((g) => g.category),
    [storesByCategory],
  );

  // ── Selected category → 2-column grid ──
  const selectedStores = useMemo(() => {
    if (!selectedCategory) return null;
    return (
      storesByCategory.find((g) => g.category.id === selectedCategory)?.stores ?? []
    );
  }, [selectedCategory, storesByCategory]);

  const navigateToStore = useCallback(
    (id: string) =>
      router.push({ pathname: '/(client)/partner-details', params: { id } }),
    [router],
  );

  const isRefreshing = storesQ.isRefetching && !storesQ.isFetchingNextPage;

  const onRefresh = () => {
    storesQ.refetch();
    categoriesQ.refetch();
  };

  // ── Horizontal store card ──
  const renderHCard = useCallback(
    (store: StoreDto) => (
      <TouchableOpacity
        key={store.id}
        style={styles.hCard}
        activeOpacity={0.85}
        onPress={() => navigateToStore(store.id)}
      >
        <Image source={getStoreImageSource(store)} style={styles.hCardImage} />
        <View style={styles.hCardBody}>
          <Text style={styles.hCardName} numberOfLines={1}>
            {store.name || store.partnerName || 'Partenaire'}
          </Text>
          <Text style={styles.hCardCity} numberOfLines={1}>
            {store.city || store.address || ''}
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
    ),
    [navigateToStore],
  );

  // ── Grid store card (2-column) ──
  const renderGridCard = useCallback(
    ({ item }: { item: StoreDto }) => (
      <TouchableOpacity
        style={styles.gridCard}
        activeOpacity={0.85}
        onPress={() => navigateToStore(item.id)}
      >
        <Image source={getStoreImageSource(item)} style={styles.gridCardImage} />
        <View style={styles.gridCardBody}>
          <Text style={styles.gridCardName} numberOfLines={1}>
            {item.name || item.partnerName || 'Partenaire'}
          </Text>
          <Text style={styles.gridCardCity} numberOfLines={1}>
            {item.city || ''}
          </Text>
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

  // ── Category section with horizontal scroll ──
  const renderCategorySection = useCallback(
    (group: { category: StoreCategoryDto; stores: StoreDto[] }) => (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {group.category.name || 'Autre'}
          </Text>
          <TouchableOpacity
            onPress={() =>
              setSelectedCategory(
                selectedCategory === group.category.id
                  ? null
                  : group.category.id,
              )
            }
          >
            <Text style={styles.seeAll}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hScroll}
        >
          {group.stores.slice(0, 10).map(renderHCard)}
        </ScrollView>
      </View>
    ),
    [renderHCard, selectedCategory],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Partenaires</Text>
          <Text style={styles.subtitle}>
            {allStores.length} magasin{allStores.length !== 1 ? 's' : ''} disponible{allStores.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(client)/stores-map')}
          style={styles.mapBtn}
        >
          <Ionicons name="map-outline" size={wp(20)} color={colors.orange[500]} />
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchWrap}>
        <MSearchBar
          value={search}
          onChangeText={(text: string) => {
            setSearch(text);
            if (selectedCategory) setSelectedCategory(null);
          }}
          placeholder="Rechercher un partenaire, une ville…"
        />
      </View>

      {/* ── Category Filters — fancy pills ── */}
      {activeCategories.length > 0 && (
        <View style={styles.filtersWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
          >
            {/* "All" filter */}
            <TouchableOpacity
              style={[
                styles.filterPill,
                !selectedCategory && styles.filterPillActive,
              ]}
              onPress={() => setSelectedCategory(null)}
              activeOpacity={0.8}
            >
              {!selectedCategory ? (
                <LinearGradient
                  colors={[...colors.gradients.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.filterPillGradient}
                >
                  <Ionicons name="grid-outline" size={wp(14)} color="#FFF" />
                  <Text style={styles.filterPillTextActive}>Tous</Text>
                  <View style={styles.filterCount}>
                    <Text style={styles.filterCountText}>{filteredStores.length}</Text>
                  </View>
                </LinearGradient>
              ) : (
                <>
                  <Ionicons name="grid-outline" size={wp(14)} color={colors.neutral[600]} />
                  <Text style={styles.filterPillText}>Tous</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Category filters */}
            {activeCategories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const count = storesByCategory.find((g) => g.category.id === cat.id)?.stores.length ?? 0;

              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.filterPill,
                    isActive && styles.filterPillActive,
                  ]}
                  onPress={() =>
                    setSelectedCategory(isActive ? null : cat.id)
                  }
                  activeOpacity={0.8}
                >
                  {isActive ? (
                    <LinearGradient
                      colors={[...colors.gradients.primary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.filterPillGradient}
                    >
                      <Text style={styles.filterPillTextActive}>
                        {cat.name || cat.code || 'Autre'}
                      </Text>
                      <View style={styles.filterCount}>
                        <Text style={styles.filterCountText}>{count}</Text>
                      </View>
                    </LinearGradient>
                  ) : (
                    <>
                      <Text style={styles.filterPillText}>
                        {cat.name || cat.code || 'Autre'}
                      </Text>
                      <View style={styles.filterCountInactive}>
                        <Text style={styles.filterCountTextInactive}>{count}</Text>
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Content */}
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
      ) : selectedCategory ? (
        /* 2-column grid for selected category */
        <FlatList
          data={selectedStores}
          numColumns={2}
          renderItem={renderGridCard}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.orange[500]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="storefront-outline"
              title="Aucun partenaire"
              description="Aucun partenaire dans cette catégorie."
            />
          }
        />
      ) : (
        /* Category sections with horizontal scrolls */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: wp(100) }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.orange[500]}
            />
          }
        >
          {storesByCategory.length === 0 ? (
            <EmptyState
              icon="storefront-outline"
              title="Aucun partenaire trouvé"
              description="Essayez une autre recherche ou explorez la carte."
              actionLabel="Voir la carte"
              onAction={() => router.push('/(client)/stores-map')}
            />
          ) : (
            storesByCategory.map((group) => (
              <React.Fragment key={group.category.id}>
                {renderCategorySection(group)}
              </React.Fragment>
            ))
          )}

          {storesQ.hasNextPage && (
            <TouchableOpacity
              style={styles.loadMoreBtn}
              onPress={() => storesQ.fetchNextPage()}
              disabled={storesQ.isFetchingNextPage}
            >
              {storesQ.isFetchingNextPage ? (
                <ActivityIndicator size="small" color={colors.orange[500]} />
              ) : (
                <Text style={styles.loadMoreText}>
                  Charger plus de partenaires
                </Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[3],
    paddingBottom: spacing[1],
  },
  title: {
    ...textStyles.h2,
    color: colors.neutral[900],
  },
  subtitle: {
    ...textStyles.micro,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  mapBtn: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(22),
    backgroundColor: colors.orange[50],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  searchWrap: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[2],
  },

  /* ── Fancy Filter Pills ── */
  filtersWrap: {
    marginBottom: spacing[3],
  },
  filtersContainer: {
    paddingHorizontal: spacing[6],
    gap: spacing[2],
    alignItems: 'center',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: spacing[2],
    ...shadows.sm,
  },
  filterPillActive: {
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  filterPillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    gap: spacing[2],
  },
  filterPillText: {
    ...textStyles.caption,
    fontFamily: fontFamily.medium,
    color: colors.neutral[700],
  },
  filterPillTextActive: {
    ...textStyles.caption,
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },
  filterCount: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: wp(10),
    minWidth: wp(20),
    height: wp(20),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[1],
  },
  filterCountText: {
    ...textStyles.micro,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
    fontSize: wp(10),
  },
  filterCountInactive: {
    backgroundColor: colors.neutral[100],
    borderRadius: wp(10),
    minWidth: wp(20),
    height: wp(20),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[1],
  },
  filterCountTextInactive: {
    ...textStyles.micro,
    fontFamily: fontFamily.bold,
    color: colors.neutral[500],
    fontSize: wp(10),
  },

  /* ── Category sections ── */
  section: {
    marginBottom: spacing[5],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
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
  hScroll: {
    paddingLeft: spacing[6],
    paddingRight: spacing[3],
    gap: spacing[3],
  },

  /* ── Horizontal card ── */
  hCard: {
    width: HCARD_WIDTH,
    backgroundColor: '#1E293B',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.sm,
  },
  hCardImage: {
    width: HCARD_WIDTH,
    height: HCARD_WIDTH * 0.6,
    resizeMode: 'cover',
    backgroundColor: colors.neutral[100],
  },
  hCardBody: {
    padding: spacing[3],
  },
  hCardName: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
  },
  hCardCity: {
    ...textStyles.micro,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },

  /* ── Grid view (2-column) ── */
  gridList: {
    paddingHorizontal: spacing[6],
    paddingBottom: wp(100),
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  gridCard: {
    width: CARD_WIDTH,
    backgroundColor: '#1E293B',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.sm,
  },
  gridCardImage: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 0.65,
    resizeMode: 'cover',
    backgroundColor: colors.neutral[100],
  },
  gridCardBody: {
    padding: spacing[3],
  },
  gridCardName: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
  },
  gridCardCity: {
    ...textStyles.micro,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },

  /* ── Load more ── */
  loadMoreBtn: {
    alignItems: 'center',
    paddingVertical: spacing[4],
    marginBottom: spacing[4],
  },
  loadMoreText: {
    ...textStyles.body,
    color: colors.orange[500],
    fontFamily: fontFamily.semiBold,
  },
});
