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

interface HomeNearbyOffersProps {
  onViewMap?: () => void;
}

const formatDistance = (distance: number | null): string => {
  if (!distance) return '';
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${Math.round(distance)}km`;
};

export const HomeNearbyOffers: React.FC<HomeNearbyOffersProps> = ({ onViewMap }) => {
  const insets = useSafeAreaInsets();
  const [offers, setOffers] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Partner | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

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

      // Récupérer les stores à proximité (rayon raisonnable pour les offres : 50km)
      // On récupère plus de résultats pour avoir plus de choix après filtrage
      const response = await StoresApi.searchStores({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        radiusKm: 50, // Rayon réduit pour des offres vraiment à proximité
        page: 1,
        pageSize: 20, // Récupérer plus de résultats pour mieux filtrer
      });

      // Mapper les stores en partenaires
      const mapped = response.items
        .map((store, index) => mapStoreToPartner(store, index))
        .filter(partner => {
          // Filtrer seulement ceux avec des promotions actives
          if (!partner.promotion?.isActive) return false;
          
          // Filtrer les stores fermés
          if (!partner.isOpen) return false;
          
          // Filtrer par distance maximale (50km)
          if (partner.distance && partner.distance > 50) return false;
          
          // Filtrer par note minimale (3.0 minimum)
          if (partner.rating < 3.0) return false;
          
          return true;
        });
      
      // Trier les stores par priorité :
      // 1. Distance (plus proche = mieux)
      // 2. Note (meilleure note = mieux)
      // 3. Qualité de la promotion (meilleure réduction = mieux)
      const sortedMapped = mapped.sort((a, b) => {
        // Priorité 1: Distance
        const distanceA = a.distance ?? Infinity;
        const distanceB = b.distance ?? Infinity;
        if (Math.abs(distanceA - distanceB) > 5) {
          // Si la différence de distance est significative (>5km), prioriser la distance
          return distanceA - distanceB;
        }
        
        // Priorité 2: Note
        const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
        if (Math.abs(ratingDiff) > 0.5) {
          return ratingDiff;
        }
        
        // Priorité 3: Qualité de la promotion (extraire le pourcentage de réduction)
        const getDiscountPercent = (promo: any): number => {
          if (!promo?.discount) return 0;
          const match = promo.discount.match(/(\d+)%/);
          return match ? parseInt(match[1], 10) : 0;
        };
        const discountA = getDiscountPercent(a.promotion);
        const discountB = getDiscountPercent(b.promotion);
        return discountB - discountA;
      });
      
      // Prendre les 2 meilleures offres
      setOffers(sortedMapped.slice(0, 2));
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
        {offers.map((offer, index) => {
          // Extraire le pourcentage de réduction pour l'affichage
          const getDiscountPercent = (promo: any): number => {
            if (!promo?.discount) return 0;
            const match = promo.discount.match(/(\d+)%/);
            return match ? parseInt(match[1], 10) : 0;
          };
          const discountPercent = getDiscountPercent(offer.promotion);
          const isBestOffer = index === 0 && discountPercent > 0;
          
          return (
            <View key={offer.id} style={[styles.offerItem, isBestOffer && styles.offerItemBest]}>
              {isBestOffer && (
                <View style={styles.bestOfferBadge}>
                  <Ionicons name="star" size={12} color="#FFFFFF" />
                  <Text style={styles.bestOfferText}>Meilleure offre</Text>
                </View>
              )}
              <View style={styles.offerContent}>
                <View style={styles.offerLeft}>
                  <View style={styles.offerHeader}>
                    <Text style={styles.offerName} numberOfLines={1}>
                      {offer.name}
                    </Text>
                    {discountPercent > 0 && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountBadgeText}>-{discountPercent}%</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.offerDescription} numberOfLines={2}>
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
                      <View style={styles.offerDistanceContainer}>
                        <Ionicons name="location" size={12} color="rgba(255, 255, 255, 0.6)" />
                        <Text style={styles.offerDistance}>{formatDistance(offer.distance)}</Text>
                      </View>
                    )}
                  </View>
                </View>
              <TouchableOpacity
                style={styles.useButton}
                onPress={async () => {
                  setSelectedOffer(offer);
                  setShowOfferModal(true);
                  setDetailLoading(true);
                  try {
                    const detailDto = await StoresApi.getStoreById(offer.id);
                    const mapped = mapStoreToPartner(detailDto, 0);
                    setSelectedOffer(mapped);
                  } catch (err) {
                    console.error('Erreur lors du chargement des détails:', err);
                  } finally {
                    setDetailLoading(false);
                  }
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="percent" size={16} color="#FFFFFF" />
                <Text style={styles.useButtonText}>Utiliser</Text>
              </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* Modal de détails de l'offre */}
      <Modal
        visible={showOfferModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowOfferModal(false)}
      >
        {selectedOffer && (
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
                  onPress={() => setShowOfferModal(false)}
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
                        const image = getRestaurantImage(selectedOffer.id, selectedOffer.name, selectedOffer.category, 800, 400);
                        return typeof image === 'number' ? image : { uri: image };
                      })()}
                      style={styles.modalImageContent}
                      resizeMode="cover"
                    />
                    {selectedOffer.promotion?.isActive && (
                      <LinearGradient
                        colors={[Colors.status.success, '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.modalImagePromoBadge}
                      >
                        <Ionicons name="pricetag" size={11} color={Colors.text.light} />
                        <Text style={styles.modalImagePromoText}>
                          {selectedOffer.promotion.discount}
                        </Text>
                      </LinearGradient>
                    )}
                  </View>

                  {/* Info principale */}
                  <View style={styles.modalHeroInfo}>
                    <Text style={styles.modalName} numberOfLines={2}>
                      {selectedOffer.name}
                    </Text>
                    
                    <View style={styles.modalBadgesRow}>
                      {selectedOffer.rating > 0 && (
                        <LinearGradient
                          colors={['rgba(251, 191, 36, 0.2)', 'rgba(251, 191, 36, 0.1)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.modalRatingBadge}
                        >
                          <Ionicons name="star" size={12} color={Colors.accent.gold} />
                          <Text style={styles.modalRatingText}>
                            {selectedOffer.rating.toFixed(1)}
                          </Text>
                        </LinearGradient>
                      )}

                      {selectedOffer.category && (
                        <View style={styles.modalCategoryBadge}>
                          <Ionicons name="pricetag-outline" size={11} color={Colors.text.light} />
                          <Text style={styles.modalCategoryText}>
                            {selectedOffer.category}
                          </Text>
                        </View>
                      )}

                      <View style={[
                        styles.modalQuickStatusBadge,
                        selectedOffer.isOpen ? styles.modalQuickStatusOpen : styles.modalQuickStatusClosed
                      ]}>
                        <View style={[
                          styles.modalQuickStatusDot,
                          { backgroundColor: selectedOffer.isOpen ? Colors.status.success : Colors.status.error }
                        ]} />
                        <Text style={[
                          styles.modalQuickStatusText,
                          { color: selectedOffer.isOpen ? Colors.status.success : Colors.status.error }
                        ]}>
                          {selectedOffer.isOpen ? 'Ouvert' : 'Fermé'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Promotion */}
                {selectedOffer.promotion?.isActive && (
                  <View style={styles.modalPromoCard}>
                    <View style={styles.modalPromoHeader}>
                      <Ionicons name="pricetag" size={20} color={Colors.status.success} />
                      <Text style={styles.modalPromoTitle}>Offre spéciale</Text>
                    </View>
                    <Text style={styles.modalPromoDiscount}>{selectedOffer.promotion.discount}</Text>
                    {selectedOffer.promotion.description && (
                      <Text style={styles.modalPromoDescription}>{selectedOffer.promotion.description}</Text>
                    )}
                  </View>
                )}

                {/* Bouton d'action */}
                {selectedOffer.latitude && selectedOffer.longitude && (
                  <View style={styles.modalActionWrapper}>
                    <TouchableOpacity 
                      style={styles.modalActionButton}
                      activeOpacity={0.8}
                      onPress={() => {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedOffer.latitude},${selectedOffer.longitude}`;
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
                      {selectedOffer.address}
                    </Text>
                    {selectedOffer.distance !== null && (
                      <View style={styles.modalInfoBadge}>
                        <Ionicons name="walk" size={14} color="#8B2F3F" />
                        <Text style={styles.modalInfoBadgeText}>
                          {Math.round(selectedOffer.distance)} km
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Description */}
                {selectedOffer.description && (
                  <View style={styles.modalDescriptionCard}>
                    <Text style={styles.modalDescriptionTitle}>À propos</Text>
                    <Text style={styles.modalDescription}>
                      {selectedOffer.description}
                    </Text>
                  </View>
                )}

                {/* Bouton voir plus */}
                <TouchableOpacity
                  style={styles.modalMoreButton}
                  onPress={() => {
                    setShowOfferModal(false);
                    router.push(`/(tabs)/partners?partnerId=${selectedOffer.id}`);
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
    position: 'relative',
  } as ViewStyle,
  offerItemBest: {
    borderColor: '#10B981',
    borderWidth: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  } as ViewStyle,
  bestOfferBadge: {
    position: 'absolute',
    top: -8,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    zIndex: 1,
  } as ViewStyle,
  bestOfferText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold as any,
    color: '#FFFFFF',
  } as TextStyle,
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  } as ViewStyle,
  discountBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  } as ViewStyle,
  discountBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold as any,
    color: '#FFFFFF',
  } as TextStyle,
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
    lineHeight: 18,
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
  offerDistanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
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
  modalPromoCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  } as ViewStyle,
  modalPromoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  } as ViewStyle,
  modalPromoTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.light,
  } as TextStyle,
  modalPromoDiscount: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '900',
    color: Colors.status.success,
    marginBottom: Spacing.xs,
  } as TextStyle,
  modalPromoDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
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

