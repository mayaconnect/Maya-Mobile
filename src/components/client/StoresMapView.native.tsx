/**
 * Native Map View Component
 * This file is resolved by Metro on iOS/Android (via .native.tsx extension).
 *
 * Features:
 *  • 5 km initial radius around user
 *  • Progressive auto-expand if no stores found (5→10→20→50→100 km)
 *  • Gradient-styled map markers matching the app's orange gradient
 *  • Search overlay + floating store card
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storesApi } from '../../api/stores.api';
import { clientColors as colors } from '../../theme/colors';
import { textStyles, fontFamily } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { wp } from '../../utils/responsive';
import { MSearchBar } from '../ui';
import { useDebounced } from '../../hooks/use-debounced';

/* ── Radius expansion steps (km) ── */
const RADIUS_STEPS = [5, 10, 20, 50, 100];
const INITIAL_RADIUS = RADIUS_STEPS[0];

/* ── Approximately how many degrees ≈ 1 km at mid-latitudes ── */
const kmToDelta = (km: number) => km / 111;

const DEFAULT_REGION = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: kmToDelta(INITIAL_RADIUS) * 2,
  longitudeDelta: kmToDelta(INITIAL_RADIUS) * 2,
};

/* ── Custom gradient marker ── */
function GradientMarker({ isSelected }: { isSelected?: boolean }) {
  return (
    <View style={markerStyles.wrapper}>
      <LinearGradient
        colors={['#FF7A18', '#FFB347']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          markerStyles.pin,
          isSelected && markerStyles.pinSelected,
        ]}
      >
        <Ionicons
          name="storefront"
          size={wp(14)}
          color="#FFFFFF"
        />
      </LinearGradient>
      <View style={markerStyles.arrow} />
    </View>
  );
}

export default function StoresMapView() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [search, setSearch] = useState('');
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [currentRadius, setCurrentRadius] = useState(INITIAL_RADIUS);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const expandingRef = useRef(false);

  /* ── Geolocate user on mount ── */
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setUserCoords(coords);
      const delta = kmToDelta(INITIAL_RADIUS) * 2;
      const newRegion = {
        ...coords,
        latitudeDelta: delta,
        longitudeDelta: delta,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 800);
    })();
  }, []);

  const debouncedRegion = useDebounced(region, 600);
  const debouncedSearch = useDebounced(search, 350);

  /* ── Fetch stores with current radius ── */
  const storesQ = useQuery({
    queryKey: [
      'storesMap',
      debouncedRegion.latitude,
      debouncedRegion.longitude,
      currentRadius,
    ],
    queryFn: () =>
      storesApi.search({
        latitude: debouncedRegion.latitude,
        longitude: debouncedRegion.longitude,
        radiusKm: currentRadius,
        pageSize: 100,
      }),
    select: (res) => res.data,
  });

  const allStores: any[] = storesQ.data?.items ?? (storesQ.data as any) ?? [];

  /* ── Auto-expand radius if no stores found ── */
  useEffect(() => {
    if (expandingRef.current) return; // avoid re-entrancy
    if (storesQ.isFetching) return;

    if (allStores.length === 0 && userCoords) {
      const currentIdx = RADIUS_STEPS.indexOf(currentRadius);
      if (currentIdx < RADIUS_STEPS.length - 1) {
        expandingRef.current = true;
        const nextRadius = RADIUS_STEPS[currentIdx + 1];
        setCurrentRadius(nextRadius);
        // Expand the visible map region to match
        const delta = kmToDelta(nextRadius) * 2;
        const expandedRegion = {
          ...userCoords,
          latitudeDelta: delta,
          longitudeDelta: delta,
        };
        mapRef.current?.animateToRegion(expandedRegion, 600);
        // Allow next expansion after a tick
        setTimeout(() => { expandingRef.current = false; }, 800);
      }
    }
  }, [allStores.length, storesQ.isFetching, currentRadius, userCoords]);

  /* ── Reset radius when user manually pans the map ── */
  const handleRegionChange = useCallback((newRegion: typeof region) => {
    setRegion(newRegion);
    // When user moves the map, reset to a reasonable radius based on visible area
    const visibleKm = Math.max(
      newRegion.latitudeDelta * 111,
      newRegion.longitudeDelta * 111,
    ) / 2;
    // Snap to the nearest step >= visibleKm
    const bestRadius = RADIUS_STEPS.find((r) => r >= visibleKm) ?? RADIUS_STEPS[RADIUS_STEPS.length - 1];
    if (bestRadius !== currentRadius) {
      setCurrentRadius(bestRadius);
    }
  }, [currentRadius]);

  /* ── Client-side search filter ── */
  const stores = useMemo(() => {
    if (!debouncedSearch.trim()) return allStores;
    const q = debouncedSearch.toLowerCase();
    return allStores.filter((s: any) =>
      (s.name ?? '').toLowerCase().includes(q) ||
      (s.partnerName ?? '').toLowerCase().includes(q) ||
      (s.city ?? '').toLowerCase().includes(q) ||
      (s.category ?? '').toLowerCase().includes(q),
    );
  }, [allStores, debouncedSearch]);

  return (
    <View style={styles.container}>
      {/* Bouton retour flottant */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + spacing[3] }]}
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={wp(22)} color="#0F172A" />
      </TouchableOpacity>

      <View style={[styles.searchOverlay, { top: insets.top + wp(48) }]}>
        <MSearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un magasin…"
          style={styles.searchBar}
        />
      </View>

      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={DEFAULT_REGION}
        region={region}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {Array.isArray(stores) &&
          stores.map((store: any) => {
            if (!store.latitude || !store.longitude) return null;
            return (
              <Marker
                key={store.id}
                coordinate={{
                  latitude: store.latitude,
                  longitude: store.longitude,
                }}
                onPress={() => setSelectedStore(store)}
                tracksViewChanges={false}
              >
                <GradientMarker isSelected={selectedStore?.id === store.id} />
                <Callout tooltip>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>
                      {store.name || 'Magasin'}
                    </Text>
                    <Text style={styles.calloutAddr}>
                      {store.address || ''}
                    </Text>
                  </View>
                </Callout>
              </Marker>
            );
          })}
      </MapView>

      {/* Radius indicator */}
      {currentRadius > INITIAL_RADIUS && (
        <View style={[styles.radiusBadge, { top: insets.top + wp(96) }]}>
          <LinearGradient
            colors={['#FF7A18', '#FFB347']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.radiusBadgeInner}
          >
            <Ionicons name="expand-outline" size={wp(12)} color="#FFF" />
            <Text style={styles.radiusText}>Rayon élargi : {currentRadius} km</Text>
          </LinearGradient>
        </View>
      )}

      <TouchableOpacity
        style={[styles.myLocationBtn, { bottom: insets.bottom + wp(110) }]}
        onPress={async () => {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setUserCoords(coords);
          setCurrentRadius(INITIAL_RADIUS);
          const delta = kmToDelta(INITIAL_RADIUS) * 2;
          const newRegion = { ...coords, latitudeDelta: delta, longitudeDelta: delta };
          mapRef.current?.animateToRegion(newRegion, 500);
        }}
      >
        <Ionicons name="locate" size={wp(22)} color={colors.orange[500]} />
      </TouchableOpacity>

      {selectedStore && (
        <TouchableOpacity
          style={[styles.storeCard, { bottom: insets.bottom + wp(100) }]}
          activeOpacity={0.92}
          onPress={() => {
            router.push({
              pathname: '/(client)/partner-details',
              params: { id: selectedStore.id },
            });
          }}
        >
          {/* Close */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setSelectedStore(null)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={wp(16)} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>

          <View style={styles.storeRow}>
            <LinearGradient
              colors={['#FF7A18', '#FFB347']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.storeIcon}
            >
              <Ionicons name="storefront" size={wp(22)} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.storeInfo}>
              <Text style={styles.storeName} numberOfLines={1}>
                {selectedStore.name || 'Magasin'}
              </Text>
              {selectedStore.address ? (
                <Text style={styles.storeAddr} numberOfLines={1}>
                  <Ionicons name="location-outline" size={wp(11)} color="rgba(255,255,255,0.45)" />
                  {' '}{selectedStore.address}{selectedStore.city ? `, ${selectedStore.city}` : ''}
                </Text>
              ) : null}
              <View style={styles.storeMeta}>
                {selectedStore.avgDiscountPercent > 0 && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>
                      -{selectedStore.avgDiscountPercent}%
                    </Text>
                  </View>
                )}
                {selectedStore.category ? (
                  <Text style={styles.categoryText}>{selectedStore.category}</Text>
                ) : null}
                {selectedStore.distanceKm != null && (
                  <Text style={styles.distanceText}>
                    {selectedStore.distanceKm < 1
                      ? `${Math.round(selectedStore.distanceKm * 1000)} m`
                      : `${selectedStore.distanceKm.toFixed(1)} km`}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.chevronBox}>
              <Ionicons name="chevron-forward" size={wp(18)} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: {
    position: 'absolute',
    left: spacing[4],
    zIndex: 10,
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  searchOverlay: {
    position: 'absolute',
    left: spacing[4],
    right: spacing[4],
    zIndex: 10,
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    ...shadows.lg,
  },
  callout: {
    minWidth: wp(150),
    maxWidth: wp(220),
    padding: spacing[2],
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
  },
  calloutTitle: {
    ...textStyles.small,
    fontFamily: fontFamily.semiBold,
    color: '#0F172A',
  },
  calloutAddr: {
    ...textStyles.micro,
    color: '#64748B',
    marginTop: spacing[1],
  },
  radiusBadge: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 10,
  },
  radiusBadgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  radiusText: {
    ...textStyles.micro,
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },
  myLocationBtn: {
    position: 'absolute',
    right: spacing[4],
    width: wp(44),
    height: wp(44),
    borderRadius: wp(22),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  storeCard: {
    position: 'absolute',
    left: spacing[4],
    right: spacing[4],
    backgroundColor: '#1E293B',
    borderRadius: borderRadius['2xl'],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    zIndex: 1,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIcon: {
    width: wp(48),
    height: wp(48),
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
    flexShrink: 0,
  },
  storeInfo: {
    flex: 1,
    marginRight: spacing[2],
  },
  storeName: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },
  storeAddr: {
    ...textStyles.micro,
    color: 'rgba(255,255,255,0.5)',
    marginTop: spacing[1],
  },
  storeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
    flexWrap: 'wrap',
  },
  discountBadge: {
    backgroundColor: 'rgba(255,122,24,0.2)',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  discountText: {
    ...textStyles.micro,
    fontFamily: fontFamily.semiBold,
    color: colors.orange[500],
  },
  categoryText: {
    ...textStyles.micro,
    color: 'rgba(255,255,255,0.4)',
  },
  distanceText: {
    ...textStyles.micro,
    color: 'rgba(255,255,255,0.4)',
  },
  chevronBox: {
    width: wp(32),
    height: wp(32),
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});

/* ── Gradient Marker styles ── */
const markerStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  pin: {
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#FF7A18',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  pinSelected: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(19),
    borderWidth: 3,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: wp(6),
    borderRightWidth: wp(6),
    borderTopWidth: wp(8),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFB347',
    marginTop: -1,
  },
});
