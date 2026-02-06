import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { StoresApi } from '@/features/stores-map/services/storesApi';
import { Partner } from '@/features/partners/types';
import { mapStoreToPartner } from '@/features/partners/utils/partnerMapper';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

interface HomeNearbyOffersProps {
  onViewMap?: () => void;
}

const formatDistance = (distance: number | null): string => {
  if (!distance) return '';
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

export const HomeNearbyOffers: React.FC<HomeNearbyOffersProps> = ({ onViewMap }) => {
  const [offers, setOffers] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNearbyOffers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Demander la permission de localisation
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission de localisation refusée');
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

      // Récupérer les stores à proximité (5km max pour les offres)
      const response = await StoresApi.searchStores({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        radiusKm: 5,
        page: 1,
        pageSize: 2, // Limiter à 2 offres pour la home
      });

      // Mapper les stores en partenaires
      const mapped = response.items
        .map((store, index) => mapStoreToPartner(store, index))
        .filter(partner => partner.promotion?.isActive) // Filtrer seulement ceux avec des promotions actives
        .slice(0, 2); // Prendre les 2 premiers

      setOffers(mapped);
    } catch (error) {
      console.error('Erreur lors du chargement des offres:', error);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNearbyOffers();
  }, [loadNearbyOffers]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Offres à proximité</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.text.light} />
        </View>
      </View>
    );
  }

  if (offers.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Offres à proximité</Text>
        <TouchableOpacity
          onPress={onViewMap || (() => router.push('/(tabs)/partners'))}
          activeOpacity={0.7}
        >
          <Text style={styles.viewMapText}>Voir carte</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.offersList}>
        {offers.map((offer) => (
          <View key={offer.id} style={styles.offerItem}>
            <View style={styles.offerContent}>
              <View style={styles.offerLeft}>
                <Text style={styles.offerName} numberOfLines={1}>
                  {offer.name}
                </Text>
                <Text style={styles.offerDescription} numberOfLines={1}>
                  {offer.promotion?.description || offer.promotion?.discount || 'Offre spéciale'}
                </Text>
                <View style={styles.offerMeta}>
                  <View style={styles.offerCategory}>
                    <Text style={styles.offerCategoryText}>{offer.category}</Text>
                  </View>
                  <View style={styles.offerRating}>
                    <Ionicons name="star" size={14} color="#FBBF24" />
                    <Text style={styles.offerRatingText}>{offer.rating.toFixed(1)}</Text>
                  </View>
                  {offer.distance && (
                    <Text style={styles.offerDistance}>{formatDistance(offer.distance)}</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={styles.useButton}
                onPress={() => router.push(`/(tabs)/partners?partnerId=${offer.id}`)}
                activeOpacity={0.8}
              >
                <Ionicons name="percent" size={16} color="#FFFFFF" />
                <Text style={styles.useButtonText}>Utiliser</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
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
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.light,
    letterSpacing: -0.3,
  } as TextStyle,
  viewMapText: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  } as ViewStyle,
  offersList: {
    gap: Spacing.md,
  } as ViewStyle,
  offerItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Shadows.sm,
  } as ViewStyle,
  offerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  offerLeft: {
    flex: 1,
    marginRight: Spacing.md,
  } as ViewStyle,
  offerName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.light,
    marginBottom: 4,
  } as TextStyle,
  offerDescription: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: Spacing.xs,
  } as TextStyle,
  offerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  } as ViewStyle,
  offerCategory: {
    backgroundColor: 'rgba(139, 47, 63, 0.2)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  } as ViewStyle,
  offerCategoryText: {
    fontSize: Typography.sizes.xs,
    color: '#8B2F3F',
    fontWeight: Typography.weights.semibold as any,
  } as TextStyle,
  offerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  offerRatingText: {
    fontSize: Typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: Typography.weights.semibold as any,
  } as TextStyle,
  offerDistance: {
    fontSize: Typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.6)',
  } as TextStyle,
  useButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#10B981',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  } as ViewStyle,
  useButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold as any,
    color: '#FFFFFF',
  } as TextStyle,
});

