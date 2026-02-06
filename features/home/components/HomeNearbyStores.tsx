import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { StoresApi } from '@/features/stores-map/services/storesApi';
import { Partner } from '@/features/partners/types';
import { mapStoreToPartner } from '@/features/partners/utils/partnerMapper';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

const formatDistance = (distance: number | null): string => {
  if (!distance) return '';
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

export const HomeNearbyStores: React.FC = () => {
  const [stores, setStores] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNearbyStores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Demander la permission de localisation
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission de localisation refusée');
        setLoading(false);
        return;
      }

      // Récupérer la position actuelle
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Récupérer les stores à proximité (5km max)
      const response = await StoresApi.searchStores({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        radiusKm: 5,
        page: 1,
        pageSize: 3, // Limiter à 3 stores
      });

      // Mapper les stores en partenaires
      const mapped = response.items
        .map((store, index) => mapStoreToPartner(store, index))
        .slice(0, 3); // Prendre les 3 premiers

      setStores(mapped);
    } catch (error) {
      console.error('Erreur lors du chargement des stores:', error);
      setError('Impossible de charger les magasins à proximité');
      setStores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNearbyStores();
  }, [loadNearbyStores]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="location" size={20} color={Colors.text.light} />
          <Text style={styles.title}>Près de chez moi</Text>
        </View>
        {stores.length > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/partners')}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>Voir tout →</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.text.light} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : stores.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucun magasin à proximité</Text>
        </View>
      ) : (
        <View style={styles.storesList}>
          {stores.map((store) => (
            <TouchableOpacity
              key={store.id}
              style={styles.storeItem}
              onPress={() => router.push(`/(tabs)/partners?partnerId=${store.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.storeContent}>
                <View style={styles.storeIcon}>
                  <Ionicons name="storefront" size={24} color="#8B2F3F" />
                </View>
                <View style={styles.storeInfo}>
                  <Text style={styles.storeName} numberOfLines={1}>
                    {store.name}
                  </Text>
                  <Text style={styles.storeDescription} numberOfLines={1}>
                    {store.description || store.category}
                  </Text>
                  <View style={styles.storeMeta}>
                    {store.rating > 0 && (
                      <View style={styles.storeRating}>
                        <Ionicons name="star" size={14} color="#FBBF24" />
                        <Text style={styles.storeRatingText}>{store.rating.toFixed(1)}</Text>
                      </View>
                    )}
                    {store.distance && (
                      <View style={styles.storeDistance}>
                        <Ionicons name="location" size={12} color="rgba(255, 255, 255, 0.6)" />
                        <Text style={styles.storeDistanceText}>{formatDistance(store.distance)}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  } as ViewStyle,
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  } as ViewStyle,
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.light,
    letterSpacing: -0.3,
  } as TextStyle,
  viewAllText: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  } as ViewStyle,
  errorContainer: {
    padding: Spacing.md,
    alignItems: 'center',
  } as ViewStyle,
  errorText: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  } as TextStyle,
  emptyContainer: {
    padding: Spacing.md,
    alignItems: 'center',
  } as ViewStyle,
  emptyText: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  } as TextStyle,
  storesList: {
    gap: Spacing.sm,
  } as ViewStyle,
  storeItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Shadows.sm,
  } as ViewStyle,
  storeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  } as ViewStyle,
  storeIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(139, 47, 63, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  storeInfo: {
    flex: 1,
  } as ViewStyle,
  storeName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.light,
    marginBottom: 4,
  } as TextStyle,
  storeDescription: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: Spacing.xs,
  } as TextStyle,
  storeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  } as ViewStyle,
  storeRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  storeRatingText: {
    fontSize: Typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: Typography.weights.semibold as any,
  } as TextStyle,
  storeDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  storeDistanceText: {
    fontSize: Typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.6)',
  } as TextStyle,
});
