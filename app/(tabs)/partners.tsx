import { NavigationTransition } from '@/components/common/navigation-transition';
import { PartnerCard } from '@/components/partners/partner-card';
import { PartnersHeader } from '@/components/partners/partners-header';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { PartnerService } from '@/services/partner.service';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type PartnerUI = {
  id: string;
  name: string;
  description: string;
  address: string;
  distance: number | null;
  isOpen: boolean;
  closingTime: string | null;
  category: string;
  image: string;
  promotion?: {
    discount: string;
    description: string;
    isActive: boolean;
  } | null;
  rating: number;
};

export default function PartnersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [viewMode, setViewMode] = useState<'grille' | 'liste'>('grille');
  const [selectedPartner, setSelectedPartner] = useState<PartnerUI | null>(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [partners, setPartners] = useState<PartnerUI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  
  // Animation pour les transitions
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  const computeCategory = useCallback((dto: any): string => {
    if (!dto) return 'Partenaire';
    if (dto.category) return dto.category;
    if (dto.sector) return dto.sector;
    if (dto.businessType) return dto.businessType;
    if (dto.tags?.length) return dto.tags[0];
    return 'Partenaire';
  }, []);

  const computeAddress = useCallback((dto: any): string => {
    if (!dto) {
      return 'Adresse non renseignée';
    }

    const store = dto.primaryStore ?? dto.mainStore ?? dto.store ?? dto.stores?.[0];
    const address = store?.address ?? dto.address;

    if (address) {
      if (typeof address === 'string') {
        return address;
      }

      const parts = [address.street, address.postalCode, address.city].filter(Boolean);
      if (parts.length) {
        return parts.join(', ');
      }
    }

    return dto.city ?? dto.location ?? 'Adresse non renseignée';
  }, []);

  const computePromotion = useCallback((dto: any) => {
    const promo = dto.activePromotion ?? dto.currentPromotion ?? dto.promotion;
    if (!promo) {
      return null;
    }

    return {
      discount: promo.discountLabel ?? promo.discount ?? promo.title ?? 'Promo',
      description: promo.description ?? promo.details ?? 'Promotion disponible',
      isActive: promo.isActive ?? true,
    };
  }, []);

  const mapPartner = useCallback((dto: any, index: number): PartnerUI => {
    const fallbackEmojis = ['🏬', '🍽️', '☕', '🍕', '🍣', '🥗', '🍰'];
    const image = dto.emoji ?? dto.icon ?? fallbackEmojis[index % fallbackEmojis.length];

    const rawDistance = dto.distance ?? dto.distanceKm ?? dto.distanceKM ?? dto.distanceMeters ?? null;
    const distanceValue =
      rawDistance === null || rawDistance === undefined ? null : Number(rawDistance);
    const rawRating = dto.averageRating ?? dto.rating ?? dto.score ?? dto.reviewScore;
    const ratingValue =
      rawRating === null || rawRating === undefined || Number.isNaN(Number(rawRating))
        ? 4
        : Number(rawRating);

    return {
      id: dto.id ?? dto.partnerId ?? `partner-${index}`,
      name: dto.name ?? dto.companyName ?? dto.legalName ?? dto.email ?? 'Partenaire',
      description: dto.description ?? dto.summary ?? 'Partenaire du programme Maya',
      address: computeAddress(dto),
      distance: distanceValue,
      isOpen: dto.isOpen ?? dto.openNow ?? true,
      closingTime: dto.closingTime ?? dto.openingHours?.closing ?? null,
      category: computeCategory(dto),
      image,
      promotion: computePromotion(dto),
      rating: ratingValue,
    };
  }, [computeCategory, computeAddress, computePromotion]);

  useEffect(() => {
    let isMounted = true;

    const fetchPartners = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await PartnerService.getPartners();
        if (!isMounted) {
          return;
        }
        const list = response?.items ?? [];
        const mapped = list.map((partner, index) => mapPartner(partner, index));
        setPartners(mapped);
      } catch (err) {
        console.error('Erreur lors du chargement des partenaires:', err);
        if (isMounted) {
          setError('Impossible de récupérer les partenaires pour le moment.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPartners();
    return () => {
      isMounted = false;
    };
  }, [mapPartner]);

  const stats = useMemo(() => {
    if (!partners.length) {
      return {
        totalPartners: 0,
        nearbyPartners: 0,
        activePromotions: 0,
        averageRating: 0,
      };
    }

    const totalPartners = partners.length;
    const nearbyPartners = partners.filter((p) => (p.distance ?? Infinity) < 1).length;
    const activePromotions = partners.filter((p) => p.promotion?.isActive).length;
    const averageRating =
      partners.reduce((sum, p) => sum + (p.rating ?? 0), 0) / Math.max(partners.length, 1);

    return {
      totalPartners,
      nearbyPartners,
      activePromotions,
      averageRating,
    };
  }, [partners]);

  // Filtrage des partenaires
  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         partner.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         partner.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedCategory === 'Tous' || 
                         partner.category === selectedCategory;
    
    return matchesSearch && matchesFilter;
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleViewToggle = (mode: 'grille' | 'liste') => {
    // Animation de transition
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    setViewMode(mode);
  };

  const handlePartnerSelect = async (partner: PartnerUI) => {
    setSelectedPartner(partner);
    setShowPartnerModal(true);
    setDetailError('');
    setDetailLoading(true);

    try {
      const detailDto = await PartnerService.getPartnerById(partner.id);
      const mapped = mapPartner(detailDto, 0);
      setSelectedPartner(mapped);
    } catch (err) {
      console.error('Erreur lors du chargement du partenaire:', err);
      setDetailError('Impossible de charger les détails du partenaire.');
    } finally {
      setDetailLoading(false);
    }
  };

  const closePartnerModal = () => {
    setShowPartnerModal(false);
    setSelectedPartner(null);
    setDetailError('');
    setDetailLoading(false);
  };

  // Obtenir toutes les catégories uniques
  const categories = useMemo(() => {
    const unique = new Set(partners.map((p) => p.category || 'Partenaire'));
    return ['Tous', ...unique];
  }, [partners]);

  return (
    <NavigationTransition>
      <View style={styles.container}>
        {/* Header avec statistiques */}
        <PartnersHeader
          title="Partenaires"
          subtitle={`${filteredPartners.length} trouvé${filteredPartners.length > 1 ? 's' : ''}`}
          totalPartners={stats.totalPartners}
          nearbyPartners={stats.nearbyPartners}
          onLocationPress={() => console.log('Location pressed')}
          onNotificationPress={() => console.log('Notification pressed')}
        />

        {/* Recherche moderne */}
        <View style={styles.searchSection}>
          {/* Input de recherche moderne */}
          <View style={styles.searchInputContainer}>
            <View style={styles.searchIconWrapper}>
              <Ionicons name="search" size={18} color={Colors.primary[600]} />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un partenaire..."
              placeholderTextColor={Colors.text.secondary}
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => handleSearch('')}
                style={styles.clearBtn}
              >
                <Ionicons name="close" size={18} color={Colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Catégories modernes */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category) => {
              const isActive = selectedCategory === category;
              const getIcon = () => {
                if (category === 'Tous') return 'apps';
                if (category === 'Café') return 'cafe';
                if (category === 'Restaurant') return 'restaurant';
                if (category === 'Shop') return 'storefront';
                return 'business';
              };
              
              return (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryPill,
                    isActive && styles.categoryPillActive
                  ]}
                  onPress={() => handleCategoryChange(category)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={getIcon() as any} 
                    size={14} 
                    color={isActive ? 'white' : Colors.text.secondary} 
                    style={styles.categoryIcon}
                  />
                  <Text style={[
                    styles.categoryPillText,
                    isActive && styles.categoryPillTextActive
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Contenu principal */}
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

          {/* Toggle Vue */}
          <View style={styles.viewToggleContainer}>
            <TouchableOpacity
              style={[styles.viewToggleButton, viewMode === 'grille' && styles.viewToggleButtonActive]}
              onPress={() => handleViewToggle('grille')}
            >
              <Ionicons 
                name="grid" 
                size={18} 
                color={viewMode === 'grille' ? Colors.text.light : Colors.text.secondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleButton, viewMode === 'liste' && styles.viewToggleButtonActive]}
              onPress={() => handleViewToggle('liste')}
            >
              <Ionicons 
                name="list" 
                size={18} 
                color={viewMode === 'liste' ? Colors.text.light : Colors.text.secondary} 
              />
            </TouchableOpacity>
          </View>

          {/* Contenu conditionnel : Grille ou Liste */}
          {viewMode === 'grille' ? (
            /* Grille des partenaires */
            <View style={styles.partnersGrid}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.partnersGridContent}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary[600]} />
                    <Text style={styles.loadingText}>Chargement des partenaires…</Text>
                  </View>
                ) : error ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="alert-circle-outline" size={64} color={Colors.status.error} />
                    <Text style={styles.emptyStateTitle}>Oups…</Text>
                    <Text style={styles.emptyStateText}>{error}</Text>
                  </View>
                ) : filteredPartners.length > 0 ? (
                  filteredPartners.map((partner, index) => (
                    <TouchableOpacity
                      key={partner.id ?? index}
                      style={[
                        styles.gridCard,
                        index % 2 === 0 && styles.gridCardLeft,
                        index % 2 === 1 && styles.gridCardRight,
                      ]}
                      onPress={() => handlePartnerSelect(partner)}
                      activeOpacity={0.8}
                    >
                      {/* Image/Emoji */}
                      <View style={styles.gridCardImage}>
                        <Text style={styles.gridCardEmoji}>{partner.image}</Text>
                        {partner.promotion?.isActive && (
                          <View style={styles.gridPromoBadge}>
                            <Text style={styles.gridPromoBadgeText}>{partner.promotion.discount}</Text>
                          </View>
                        )}
                        {partner.isOpen === false && (
                          <View style={styles.gridClosedOverlay}>
                            <Text style={styles.gridClosedText}>Fermé</Text>
                          </View>
                        )}
                      </View>

                      {/* Infos */}
                      <View style={styles.gridCardInfo}>
                        <Text style={styles.gridCardName} numberOfLines={1}>
                          {partner.name}
                        </Text>
                        <View style={styles.gridCardMeta}>
                          <Ionicons name="star" size={12} color={Colors.accent.gold} />
                          <Text style={styles.gridCardRating}>{partner.rating?.toFixed?.(1) ?? partner.rating}</Text>
                          {partner.distance !== null && partner.distance !== undefined && (
                            <Text style={styles.gridCardDistance}>• {partner.distance} km</Text>
                          )}
                        </View>
                        <Text style={styles.gridCardAddress} numberOfLines={1}>
                          {partner.address}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="storefront-outline" size={64} color={Colors.text.secondary} />
                    <Text style={styles.emptyStateTitle}>Aucun partenaire trouvé</Text>
                    <Text style={styles.emptyStateText}>
                      Essayez de modifier vos critères de recherche
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          ) : (
            /* Liste des partenaires */
            <ScrollView
              style={styles.partnersList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.partnersListContent}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary[600]} />
                  <Text style={styles.loadingText}>Chargement des partenaires…</Text>
                </View>
              ) : error ? (
                <View style={styles.emptyState}>
                  <Ionicons name="alert-circle-outline" size={64} color={Colors.status.error} />
                  <Text style={styles.emptyStateTitle}>Oups…</Text>
                  <Text style={styles.emptyStateText}>{error}</Text>
                </View>
              ) : filteredPartners.length > 0 ? (
                filteredPartners.map((partner, index) => (
                  <PartnerCard
                    key={partner.id ?? index}
                    partner={partner}
                    onPress={() => handlePartnerSelect(partner)}
                    style={styles.partnerCard}
                  />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="storefront-outline" size={64} color={Colors.text.secondary} />
                  <Text style={styles.emptyStateTitle}>Aucun partenaire trouvé</Text>
                  <Text style={styles.emptyStateText}>
                    Essayez de modifier vos critères de recherche
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </Animated.View>

        {/* Modal des détails du partenaire */}
        <Modal
          visible={showPartnerModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={closePartnerModal}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.closeButton} onPress={closePartnerModal}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Détails du partenaire</Text>
            </View>
            
            {selectedPartner && (
              <View style={styles.modalContent}>
                {detailLoading && (
                  <View style={styles.modalLoading}>
                    <ActivityIndicator size="small" color={Colors.primary[600]} />
                    <Text style={styles.modalLoadingText}>Actualisation…</Text>
                  </View>
                )}
                {!!detailError && (
                  <View style={styles.modalError}>
                    <Ionicons name="warning" size={18} color={Colors.status.error} />
                    <Text style={styles.modalErrorText}>{detailError}</Text>
                  </View>
                )}

                <View style={styles.modalImageContainer}>
                  <Text style={styles.modalImageText}>{selectedPartner.image}</Text>
                </View>
                
                <View style={styles.modalInfo}>
                  <Text style={styles.modalName}>{selectedPartner.name}</Text>
                  <View style={styles.modalRating}>
                    <Ionicons name="star" size={20} color={Colors.accent.gold} />
                    <Text style={styles.modalRatingText}>{selectedPartner.rating}</Text>
                  </View>
                  
                  <Text style={styles.modalDescription}>{selectedPartner.description}</Text>
                  
                  <View style={styles.modalLocation}>
                    <Ionicons name="location" size={16} color={Colors.text.secondary} />
                    <Text style={styles.modalAddress}>{selectedPartner.address}</Text>
                    <Text style={styles.modalDistance}>{selectedPartner.distance} km</Text>
                  </View>
                  
                  <View style={styles.modalStatus}>
                    <View style={[styles.modalStatusChip, selectedPartner.isOpen ? styles.modalStatusOpen : styles.modalStatusClosed]}>
                      <Ionicons 
                        name="time" 
                        size={14} 
                        color={selectedPartner.isOpen ? Colors.status.success : Colors.status.error} 
                      />
                      <Text style={[
                        styles.modalStatusText,
                        { color: selectedPartner.isOpen ? Colors.status.success : Colors.status.error }
                      ]}>
                        {selectedPartner.isOpen ? 'Ouvert' : 'Fermé'}
                      </Text>
                      {selectedPartner.isOpen && (
                        <Text style={styles.modalClosingTime}>• {selectedPartner.closingTime}</Text>
                      )}
                    </View>
                  </View>
                  
                  {selectedPartner.promotion && selectedPartner.promotion.isActive && (
                    <View style={styles.modalPromotion}>
                      <View style={styles.modalPromotionTag}>
                        <Text style={styles.modalPromotionDiscount}>{selectedPartner.promotion.discount}</Text>
                      </View>
                      <Text style={styles.modalPromotionText}>{selectedPartner.promotion.description}</Text>
                    </View>
                  )}
                </View>
                
                <TouchableOpacity style={styles.modalActionButton}>
                  <Ionicons name="navigate" size={20} color={Colors.text.light} />
                  <Text style={styles.modalActionText}>Y aller</Text>
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </Modal>
      </View>
    </NavigationTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.light,
  } as ViewStyle,
  
  // Section recherche moderne
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
    backgroundColor: Colors.background.light,
  } as ViewStyle,
  
  // Input de recherche moderne
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.08)',
  } as ViewStyle,
  searchIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  } as ViewStyle,
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    padding: 0,
    fontWeight: '500',
  } as TextStyle,
  clearBtn: {
    padding: 4,
    marginLeft: Spacing.xs,
  } as ViewStyle,
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
  } as ViewStyle,
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  } as ViewStyle,
  emptyStateTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  } as TextStyle,
  emptyStateText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,
  loadingText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
  } as TextStyle,
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  } as ViewStyle,
  
  // Catégories modernes
  categoriesContainer: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  } as ViewStyle,
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.card,
    borderWidth: 1.5,
    borderColor: Colors.primary[100],
    minHeight: 38,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    gap: 6,
  } as ViewStyle,
  categoryPillActive: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[600],
    shadowColor: Colors.primary[600],
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  } as ViewStyle,
  categoryPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  } as TextStyle,
  categoryPillTextActive: {
    color: 'white',
    fontWeight: '700',
  } as TextStyle,
  categoryIcon: {
    marginRight: 2,
  } as TextStyle,
  
  // Toggle Vue
  viewToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: BorderRadius.full,
    padding: 4,
    alignSelf: 'flex-end',
    marginBottom: Spacing.md,
    marginRight: -Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,
  viewToggleButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    minWidth: 40,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  viewToggleButtonActive: {
    backgroundColor: Colors.primary[600],
    shadowColor: Colors.primary[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  } as ViewStyle,
  
  // Grille
  partnersGrid: {
    flex: 1,
  } as ViewStyle,
  partnersGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.xs,
  } as ViewStyle,
  
  // Cards de grille
  gridCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.primary[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  } as ViewStyle,
  gridCardLeft: {
    marginRight: '2%',
  } as ViewStyle,
  gridCardRight: {
    marginRight: 0,
  } as ViewStyle,
  gridCardImage: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  } as ViewStyle,
  gridCardEmoji: {
    fontSize: 48,
  } as TextStyle,
  gridPromoBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.status.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    shadowColor: Colors.status.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  } as ViewStyle,
  gridPromoBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'white',
  } as TextStyle,
  gridClosedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  gridClosedText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  } as TextStyle,
  gridCardInfo: {
    padding: Spacing.sm,
  } as ViewStyle,
  gridCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  } as TextStyle,
  gridCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  } as ViewStyle,
  gridCardRating: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
  } as TextStyle,
  gridCardDistance: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  } as TextStyle,
  gridCardAddress: {
    fontSize: 11,
    color: Colors.text.secondary,
    lineHeight: 14,
  } as TextStyle,
  
  // Liste
  partnersList: {
    flex: 1,
  } as ViewStyle,
  partnersListContent: {
    paddingBottom: Spacing.xl,
  } as ViewStyle,
  partnerCard: {
    marginBottom: Spacing.md,
  } as ViewStyle,
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background.light,
  } as ViewStyle,
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary[200],
  } as ViewStyle,
  closeButton: {
    padding: Spacing.sm,
  } as ViewStyle,
  modalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: Spacing.md,
  } as TextStyle,
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  } as ViewStyle,
  modalLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary[50],
    marginBottom: Spacing.sm,
  } as ViewStyle,
  modalLoadingText: {
    color: Colors.primary[600],
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  } as TextStyle,
  modalError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.status.error + '20',
    borderWidth: 1,
    borderColor: Colors.status.error,
    marginBottom: Spacing.sm,
  } as ViewStyle,
  modalErrorText: {
    color: Colors.status.error,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  } as TextStyle,
  modalImageContainer: {
    width: 80,
    height: 80,
    backgroundColor: Colors.primary[100],
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  } as ViewStyle,
  modalImageText: {
    fontSize: 32,
    color: Colors.text.primary,
  } as TextStyle,
  modalInfo: {
    marginBottom: Spacing.xl,
  } as ViewStyle,
  modalName: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  } as TextStyle,
  modalRating: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  } as ViewStyle,
  modalRatingText: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  } as TextStyle,
  modalDescription: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 22,
  } as TextStyle,
  modalLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  } as ViewStyle,
  modalAddress: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    flex: 1,
    textAlign: 'center',
  } as TextStyle,
  modalDistance: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
  } as TextStyle,
  modalStatus: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  } as ViewStyle,
  modalStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  } as ViewStyle,
  modalStatusOpen: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  } as ViewStyle,
  modalStatusClosed: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  } as ViewStyle,
  modalStatusText: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
  } as TextStyle,
  modalClosingTime: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  modalPromotion: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderWidth: 1,
    borderColor: Colors.status.success,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  } as ViewStyle,
  modalPromotionTag: {
    backgroundColor: Colors.status.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  } as ViewStyle,
  modalPromotionDiscount: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.text.light,
  } as TextStyle,
  modalPromotionText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    fontWeight: '500',
  } as TextStyle,
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[600],
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  } as ViewStyle,
  modalActionText: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.light,
  } as TextStyle,
});
