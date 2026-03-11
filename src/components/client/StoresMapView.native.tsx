/**
 * Native Map View Component
 * This file is resolved by Metro on iOS/Android (via .native.tsx extension).
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storesApi } from '../../api/stores.api';
import { clientColors as colors } from '../../theme/colors';
import { textStyles, fontFamily } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { wp } from '../../utils/responsive';
import { MSearchBar, MCard, MHeader } from '../ui';

const DEFAULT_REGION = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function StoresMapView() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [search, setSearch] = useState('');
  const [selectedStore, setSelectedStore] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const newRegion = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 800);
    })();
  }, []);

  const storesQ = useQuery({
    queryKey: ['storesMap', region.latitude, region.longitude, search],
    queryFn: () =>
      storesApi.search({
        latitude: region.latitude,
        longitude: region.longitude,
        radiusKm: 15,
        category: search || undefined,
      }),
    select: (res) => res.data,
  });

  const stores = storesQ.data?.items ?? storesQ.data ?? [];

  return (
    <View style={styles.container}>
      <MHeader title="Carte des magasins" showBack transparent />

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
        onRegionChangeComplete={setRegion}
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
                pinColor={colors.orange[500]}
                onPress={() => setSelectedStore(store)}
              >
                <Callout>
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

      <TouchableOpacity
        style={[styles.myLocationBtn, { bottom: insets.bottom + wp(110) }]}
        onPress={async () => {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const newRegion = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          };
          mapRef.current?.animateToRegion(newRegion, 500);
        }}
      >
        <Ionicons name="locate" size={wp(22)} color={colors.orange[500]} />
      </TouchableOpacity>

      {selectedStore && (
        <MCard
          style={{ ...styles.storeCard, bottom: insets.bottom + wp(100) }}
          elevation="xl"
          onPress={() => {
            router.push({
              pathname: '/(client)/partner-details',
              params: { id: selectedStore.id },
            });
          }}
        >
          <View style={styles.storeRow}>
            <View style={styles.storeIcon}>
              <Ionicons name="storefront" size={wp(24)} color={colors.orange[500]} />
            </View>
            <View style={styles.storeInfo}>
              <Text style={styles.storeName} numberOfLines={1}>
                {selectedStore.name || 'Magasin'}
              </Text>
              <Text style={styles.storeAddr} numberOfLines={1}>
                {selectedStore.address || ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={wp(20)} color={colors.neutral[300]} />
          </View>
        </MCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    padding: spacing[2],
  },
  calloutTitle: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
  },
  calloutAddr: {
    ...textStyles.micro,
    color: colors.neutral[500],
    marginTop: spacing[1],
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
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIcon: {
    width: wp(48),
    height: wp(48),
    borderRadius: borderRadius.lg,
    backgroundColor: colors.orange[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    ...textStyles.body,
    fontFamily: fontFamily.semiBold,
    color: colors.neutral[900],
  },
  storeAddr: {
    ...textStyles.caption,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
});
