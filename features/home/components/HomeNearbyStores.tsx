import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { StoresApi } from '@/features/stores-map/services/storesApi';
import { Partner } from '@/features/partners/types';
import { mapStoreToPartner } from '@/features/partners/utils/partnerMapper';
import { getRestaurantImage } from '@/features/partners/utils/restaurantImages';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageStyle,
  Linking,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const formatDistance = (distance: number | null): string => {
  if (!distance) return '';
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${Math.round(distance)}km`;
};

export const HomeNearbyStores: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [stores, setStores] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<Partner | null>(null);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

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

      // Récupérer les stores à proximité (1000km max)
      const response = await StoresApi.searchStores({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        radiusKm: 1000,
        page: 1,
        pageSize: 3, // Limiter à 3 stores
      });

      // Mapper les stores en partenaires
      const mapped = response.items
        .map((store, index) => mapStoreToPartner(store, index));
      
      // Trier les stores du plus proche au plus loin
      const sortedMapped = mapped.sort((a, b) => {
        const distanceA = a.distance ?? Infinity;
        const distanceB = b.distance ?? Infinity;
        return distanceA - distanceB;
      });
      
      // Prendre les 3 premiers
      setStores(sortedMapped.slice(0, 3));
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
              onPress={async () => {
                setSelectedStore(store);
                setShowStoreModal(true);
                setDetailLoading(true);
                try {
                  const detailDto = await StoresApi.getStoreById(store.id);
                  const mapped = mapStoreToPartner(detailDto, 0);
                  setSelectedStore(mapped);
                } catch (err) {
                  console.error('Erreur lors du chargement des détails:', err);
                } finally {
                  setDetailLoading(false);
                }
              }}
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

      {/* Modal de détails du store */}
      <Modal
        visible={showStoreModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowStoreModal(false)}
      >
        {selectedStore && (
          <LinearGradient
            colors={Colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalContainer}
          >
            <SafeAreaView style={styles.modalSafeArea} edges={['top']}>
              <StatusBar barStyle="light-content" />
              
              {/* Header avec bouton fermer */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setShowStoreModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={28} color={Colors.text.light} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={{
                  padding: Spacing.lg,
                  paddingBottom: insets.bottom + Spacing.xl,
                }}
                showsVerticalScrollIndicator={false}
              >
                {/* Hero Section avec Image */}
                <View style={styles.modalHeroSection}>
                  <View style={styles.modalImageContainer}>
                    <Image
                      source={(() => {
                        const image = getRestaurantImage(selectedStore.id, selectedStore.name, selectedStore.category, 800, 400);
                        return typeof image === 'number' ? image : { uri: image };
                      })()}
                      style={styles.modalImageContent}
                      resizeMode="cover"
                    />
                    {selectedStore.promotion?.isActive && (
                      <LinearGradient
                        colors={[Colors.status.success, '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.modalImagePromoBadge}
                      >
                        <Ionicons name="pricetag" size={11} color={Colors.text.light} />
                        <Text style={styles.modalImagePromoText}>
                          {selectedStore.promotion.discount}
                        </Text>
                      </LinearGradient>
                    )}
                  </View>

                  {/* Info principale */}
                  <View style={styles.modalHeroInfo}>
                    <Text style={styles.modalName} numberOfLines={2}>
                      {selectedStore.name}
                    </Text>
                    
                    <View style={styles.modalBadgesRow}>
                      {selectedStore.rating > 0 && (
                        <LinearGradient
                          colors={['rgba(251, 191, 36, 0.2)', 'rgba(251, 191, 36, 0.1)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.modalRatingBadge}
                        >
                          <Ionicons name="star" size={12} color={Colors.accent.gold} />
                          <Text style={styles.modalRatingText}>
                            {selectedStore.rating.toFixed(1)}
                          </Text>
                        </LinearGradient>
                      )}

                      {selectedStore.category && (
                        <View style={styles.modalCategoryBadge}>
                          <Ionicons name="pricetag-outline" size={11} color={Colors.text.light} />
                          <Text style={styles.modalCategoryText}>
                            {selectedStore.category}
                          </Text>
                        </View>
                      )}

                      <View style={[
                        styles.modalQuickStatusBadge,
                        selectedStore.isOpen ? styles.modalQuickStatusOpen : styles.modalQuickStatusClosed
                      ]}>
                        <View style={[
                          styles.modalQuickStatusDot,
                          { backgroundColor: selectedStore.isOpen ? Colors.status.success : Colors.status.error }
                        ]} />
                        <Text style={[
                          styles.modalQuickStatusText,
                          { color: selectedStore.isOpen ? Colors.status.success : Colors.status.error }
                        ]}>
                          {selectedStore.isOpen ? 'Ouvert' : 'Fermé'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Bouton d'action */}
                {selectedStore.latitude && selectedStore.longitude && (
                  <View style={styles.modalActionWrapper}>
                    <TouchableOpacity 
                      style={styles.modalActionButton}
                      activeOpacity={0.8}
                      onPress={() => {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedStore.latitude},${selectedStore.longitude}`;
                        Linking.openURL(url);
                      }}
                    >
                      <View style={styles.modalActionContent}>
                        <View style={styles.modalActionIconCircle}>
                          <Ionicons name="navigate" size={24} color={Colors.text.light} />
                        </View>
                        <Text style={styles.modalActionText}>Y aller maintenant</Text>
                        <Ionicons name="chevron-forward" size={24} color={Colors.text.light} />
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Informations principales */}
                <View style={styles.modalInfoSection}>
                  {/* Adresse */}
                  <View style={styles.modalInfoCard}>
                    <View style={styles.modalInfoCardHeader}>
                      <View style={styles.modalInfoIconContainer}>
                        <Ionicons name="location" size={20} color="#8B2F3F" />
                      </View>
                      <Text style={styles.modalInfoCardTitle}>Adresse</Text>
                    </View>
                    <Text style={styles.modalInfoCardValue} numberOfLines={2}>
                      {selectedStore.address}
                    </Text>
                    {selectedStore.distance !== null && (
                      <View style={styles.modalInfoBadge}>
                        <Ionicons name="walk" size={14} color="#8B2F3F" />
                        <Text style={styles.modalInfoBadgeText}>
                          {Math.round(selectedStore.distance)} km
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Description */}
                {selectedStore.description && (
                  <View style={styles.modalDescriptionCard}>
                    <Text style={styles.modalDescriptionTitle}>À propos</Text>
                    <Text style={styles.modalDescription}>
                      {selectedStore.description}
                    </Text>
                  </View>
                )}

                {/* Bouton voir plus */}
                <TouchableOpacity
                  style={styles.modalMoreButton}
                  onPress={() => {
                    setShowStoreModal(false);
                    router.push(`/(tabs)/partners?partnerId=${selectedStore.id}`);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalMoreButtonText}>Voir tous les détails</Text>
                  <Ionicons name="chevron-forward" size={20} color={Colors.text.light} />
                </TouchableOpacity>
              </ScrollView>
            </SafeAreaView>
          </LinearGradient>
        )}
      </Modal>
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
  // Modal styles
  modalContainer: {
    flex: 1,
  } as ViewStyle,
  modalSafeArea: {
    flex: 1,
  } as ViewStyle,
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  } as ViewStyle,
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  modalScrollView: {
    flex: 1,
  } as ViewStyle,
  modalHeroSection: {
    marginBottom: Spacing.xl,
    gap: Spacing.lg,
  } as ViewStyle,
  modalImageContainer: {
    width: '100%',
    height: 240,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    position: 'relative',
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  } as ViewStyle,
  modalImageContent: {
    width: '100%',
    height: '100%',
  } as ImageStyle,
  modalImagePromoBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    gap: 3,
    borderWidth: 2,
    borderColor: '#1A0A0E',
    ...Shadows.md,
  } as ViewStyle,
  modalImagePromoText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '800',
    color: Colors.text.light,
    letterSpacing: 0.3,
  } as TextStyle,
  modalHeroInfo: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.sm,
  } as ViewStyle,
  modalName: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '900',
    color: Colors.text.light,
    textAlign: 'left',
    letterSpacing: -0.5,
  } as TextStyle,
  modalBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  } as ViewStyle,
  modalRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  } as ViewStyle,
  modalRatingText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    color: Colors.accent.gold,
  } as TextStyle,
  modalCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 47, 63, 0.25)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(139, 47, 63, 0.4)',
  } as ViewStyle,
  modalCategoryText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.light,
    fontWeight: '600',
    letterSpacing: 0.2,
  } as TextStyle,
  modalQuickStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 3,
    borderWidth: 1,
  } as ViewStyle,
  modalQuickStatusOpen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  } as ViewStyle,
  modalQuickStatusClosed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  } as ViewStyle,
  modalQuickStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  } as ViewStyle,
  modalQuickStatusText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
  } as TextStyle,
  modalActionWrapper: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  } as ViewStyle,
  modalActionButton: {
    backgroundColor: '#8B2F3F',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    ...Shadows.lg,
  } as ViewStyle,
  modalActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  } as ViewStyle,
  modalActionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  } as ViewStyle,
  modalActionText: {
    flex: 1,
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.light,
    letterSpacing: -0.3,
  } as TextStyle,
  modalInfoSection: {
    marginBottom: Spacing.lg,
  } as ViewStyle,
  modalInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadows.sm,
  } as ViewStyle,
  modalInfoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  } as ViewStyle,
  modalInfoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(139, 47, 63, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  modalInfoCardTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  modalInfoCardValue: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.light,
    lineHeight: 20,
  } as TextStyle,
  modalInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139, 47, 63, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
    marginTop: Spacing.xs,
  } as ViewStyle,
  modalInfoBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    color: '#8B2F3F',
  } as TextStyle,
  modalDescriptionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  } as ViewStyle,
  modalDescriptionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.light,
    marginBottom: Spacing.sm,
    letterSpacing: -0.2,
  } as TextStyle,
  modalDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
    fontWeight: '400',
  } as TextStyle,
  modalMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  } as ViewStyle,
  modalMoreButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.light,
  } as TextStyle,
});
