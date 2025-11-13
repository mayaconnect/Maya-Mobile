import { NavigationTransition } from '@/components/common/navigation-transition';
import { NeoCard } from '@/components/neo/NeoCard';
import { PartnerCard } from '@/components/partners/partner-card';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { PartnerService } from '@/services/partner.service';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

type SortOption = 'recommandé' | 'distance' | 'promotions';

export default function PartnersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [viewMode, setViewMode] = useState<'grille' | 'liste'>('liste');
  const [sortOption, setSortOption] = useState<SortOption>('recommandé');
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
        setError('');
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
  const filteredPartners = partners.filter((partner) => {
    const matchesSearch = partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         partner.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         partner.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedCategory === 'Tous' || 
                         partner.category === selectedCategory;
    
    return matchesSearch && matchesFilter;
  });

  const sortedPartners = useMemo(() => {
    const sorted = [...filteredPartners];

    if (sortOption === 'distance') {
      sorted.sort((a, b) => {
        const distA = a.distance ?? Infinity;
        const distB = b.distance ?? Infinity;
        return distA - distB;
      });
    } else if (sortOption === 'promotions') {
      sorted.sort((a, b) => {
        const promoA = a.promotion?.isActive ? 0 : 1;
        const promoB = b.promotion?.isActive ? 0 : 1;
        if (promoA !== promoB) {
          return promoA - promoB;
        }
        const ratingA = a.rating ?? 0;
        const ratingB = b.rating ?? 0;
        return ratingB - ratingA;
      });
    } else {
      sorted.sort((a, b) => {
        const ratingA = a.rating ?? 0;
        const ratingB = b.rating ?? 0;
        return ratingB - ratingA;
      });
    }

    return sorted;
  }, [filteredPartners, sortOption]);

  const highlightedPartners = useMemo(() => sortedPartners.slice(0, 4), [sortedPartners]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
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

  const resultCount = sortedPartners.length;

  return (
    <NavigationTransition>
      <View style={styles.container}>
        <LinearGradient colors={['#450A1D', '#120A18']} style={styles.backgroundGradient} />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <NeoCard gradient={['#4C0F22', '#1A112A']} style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <Text style={styles.heroTitle}>Réseau de partenaires</Text>
                <Text style={styles.heroSubtitle}>
                  {resultCount} résultat{resultCount > 1 ? 's' : ''} trouvés
                </Text>
              </View>
              <View style={styles.heroSummaryRow}>
                <View style={styles.heroSummaryItem}>
                  <Text style={styles.heroSummaryValue}>{stats.totalPartners}</Text>
                  <Text style={styles.heroSummaryLabel}>Partenaires actifs</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroSummaryItem}>
                  <Text style={styles.heroSummaryValue}>{stats.activePromotions}</Text>
                  <Text style={styles.heroSummaryLabel}>Promos en cours</Text>
                </View>
              </View>
              <View style={styles.heroActions}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.heroAction,
                    sortOption === 'distance' && styles.heroActionActive,
                  ]}
                  onPress={() => handleSortChange('distance')}
                >
                  <View style={styles.heroActionIcon}>
                    <Ionicons name="navigate" size={16} color={Colors.text.light} />
                  </View>
                  <View style={styles.heroActionTexts}>
                    <Text style={styles.heroActionTitle}>À proximité</Text>
                    <Text style={styles.heroActionSubtitle}>Trie par distance</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.heroAction,
                    sortOption === 'promotions' && styles.heroActionActive,
                  ]}
                  onPress={() => handleSortChange('promotions')}
                >
                  <View style={styles.heroActionIcon}>
                    <Ionicons name="sparkles-outline" size={16} color={Colors.text.light} />
                  </View>
                  <View style={styles.heroActionTexts}>
                    <Text style={styles.heroActionTitle}>Offres flash</Text>
                    <Text style={styles.heroActionSubtitle}>Priorise les promos</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </NeoCard>

            {highlightedPartners.length > 0 && (
              <NeoCard variant="glass" style={styles.discoveryCard}>
                <View style={styles.discoveryHeader}>
                  <View>
                    <Text style={styles.discoveryTitle}>À ne pas manquer</Text>
                    <Text style={styles.discoverySubtitle}>
                      {resultCount > 0 ? `Note moyenne ${stats.averageRating.toFixed(1)} ★` : 'Sélection personnalisée'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.discoveryAction}
                    activeOpacity={0.7}
                    onPress={() => handleCategoryChange('Tous')}
                  >
                    <Text style={styles.discoveryActionLabel}>Tout afficher</Text>
                    <Ionicons name="arrow-forward" size={14} color={Colors.text.light} />
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.discoveryList}
                >
                  {highlightedPartners.map((partner) => (
                    <TouchableOpacity
                      key={`highlight-${partner.id}`}
                      activeOpacity={0.85}
                      onPress={() => handlePartnerSelect(partner)}
                    >
                      <LinearGradient
                        colors={['rgba(251,76,136,0.45)', 'rgba(37,13,45,0.9)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.discoveryItem}
                      >
                        <View style={styles.discoveryIcon}>
                          <Text style={styles.discoveryEmoji}>{partner.image}</Text>
                        </View>
                        <View style={styles.discoveryItemInfo}>
                          <View style={styles.discoveryItemHeader}>
                            <Text style={styles.discoveryName} numberOfLines={1}>
                              {partner.name}
                            </Text>
                            <View style={styles.discoveryRating}>
                              <Ionicons name="star" size={12} color={Colors.accent.gold} />
                              <Text style={styles.discoveryRatingText}>{partner.rating.toFixed(1)}</Text>
                            </View>
                          </View>
                          <Text style={styles.discoveryMeta}>{partner.category}</Text>
                          <View style={styles.discoveryChips}>
                            <View style={styles.discoveryChip}>
                              <Ionicons name="location" size={12} color={Colors.text.light} />
                              <Text style={styles.discoveryChipText}>
                                {partner.distance !== null ? `${partner.distance.toFixed(1)} km` : 'Distance N/A'}
                              </Text>
                            </View>
                            {partner.promotion?.isActive && (
                              <View style={[styles.discoveryChip, styles.discoveryPromoChip]}>
                                <Ionicons name="sparkles-outline" size={12} color={Colors.accent.gold} />
                                <Text style={styles.discoveryPromoText}>{partner.promotion.discount}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </NeoCard>
            )}

            {/* Recherche moderne */}
            <NeoCard variant="glass" style={styles.searchSectionCard}>
              <View style={styles.searchSection}>
                <View style={styles.searchIntro}>
                  <View>
                    <Text style={styles.searchTitle}>Explorer ton réseau</Text>
                    <Text style={styles.searchSubtitle}>Afficheur intelligent des partenaires Maya</Text>
                  </View>
                  <View style={styles.searchBadge}>
                    <Ionicons name="people-circle" size={16} color={Colors.text.light} />
                    <Text style={styles.searchBadgeText}>
                      {resultCount} partenaire{resultCount > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                <View style={styles.searchInputContainer}>
                  <View style={styles.searchIconWrapper}>
                    <Ionicons name="search" size={18} color={Colors.text.light} />
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
                <View style={styles.sortSection}>
                  {(['recommandé', 'distance', 'promotions'] as SortOption[]).map((option) => {
                    const isActive = sortOption === option;
                    const getIcon = () => {
                      if (option === 'distance') return 'navigate';
                      if (option === 'promotions') return 'flame';
                      return 'sparkles-outline';
                    };
                    const helper =
                      option === 'distance'
                        ? 'Plus proche en premier'
                        : option === 'promotions'
                        ? 'Met en avant les offres'
                        : 'Tri par popularité';
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[styles.sortChip, isActive && styles.sortChipActive]}
                        activeOpacity={0.75}
                        onPress={() => handleSortChange(option)}
                      >
                        <View style={styles.sortChipIcon}>
                          <Ionicons
                            name={getIcon() as any}
                            size={14}
                            color={isActive ? Colors.text.light : Colors.text.secondary}
                          />
                        </View>
                        <View style={styles.sortChipTexts}>
                          <Text style={[styles.sortChipLabel, isActive && styles.sortChipLabelActive]}>
                            {option === 'recommandé' ? 'Recommandés' : option === 'distance' ? 'Distance' : 'Promotions'}
                          </Text>
                          <Text style={styles.sortChipHelper}>{helper}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.viewToggleContainer}>
                <TouchableOpacity
                  style={[styles.viewToggleButton, viewMode === 'liste' && styles.viewToggleButtonActive]}
                  onPress={() => handleViewToggle('liste')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={viewMode === 'liste' ? 'list' : 'list-outline'}
                    size={16}
                    color={viewMode === 'liste' ? Colors.text.light : Colors.text.secondary}
                  />
                  <Text
                    style={[styles.viewToggleLabel, viewMode === 'liste' && styles.viewToggleLabelActive]}
                  >
                    Liste
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.viewToggleButton, viewMode === 'grille' && styles.viewToggleButtonActive]}
                  onPress={() => handleViewToggle('grille')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={viewMode === 'grille' ? 'grid' : 'grid-outline'}
                    size={16}
                    color={viewMode === 'grille' ? Colors.text.light : Colors.text.secondary}
                  />
                  <Text
                    style={[styles.viewToggleLabel, viewMode === 'grille' && styles.viewToggleLabelActive]}
                  >
                    Grille
                  </Text>
                </TouchableOpacity>
              </View>
            </NeoCard>

            <NeoCard gradient={['#512048', '#231537']} style={styles.featuredCard}>
              <View style={styles.featuredHeader}>
                <View>
                  <Text style={styles.featuredTitle}>Suggestion du moment</Text>
                  <Text style={styles.featuredSubtitle}>Découvre les partenaires les plus appréciés près de toi</Text>
                </View>
                <TouchableOpacity style={styles.featuredButton} onPress={() => handleCategoryChange('Tous')}>
                  <Ionicons name="sparkles-outline" size={16} color={Colors.text.light} />
                  <Text style={styles.featuredButtonLabel}>Explorer</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.featuredChips}>
                <View style={styles.featuredChip}>
                  <Ionicons name="time-outline" size={14} color={Colors.text.light} />
                  <Text style={styles.featuredChipText}>{stats.nearbyPartners} à proximité</Text>
                </View>
                <View style={styles.featuredChip}>
                  <Ionicons name="flame" size={14} color={Colors.text.light} />
                  <Text style={styles.featuredChipText}>{stats.activePromotions} offres actives</Text>
                </View>
              </View>
            </NeoCard>

            {/* Stats résumées */}
            <NeoCard variant="glass" style={styles.statsCard}>
              <View style={styles.partnerStatsGrid}>
                <View style={styles.partnerStatCard}>
                  <View style={styles.statIconWrapper}>
                    <Ionicons name="people" size={18} color={Colors.primary[600]} />
                  </View>
                  <Text style={styles.partnerStatValue}>{stats.totalPartners}</Text>
                  <Text style={styles.partnerStatLabel}>Partenaires actifs</Text>
                </View>
                <View style={styles.partnerStatCard}>
                  <View style={[styles.statIconWrapper, styles.statIconSecondary]}>
                    <Ionicons name="location" size={18} color={Colors.accent.cyan} />
                  </View>
                  <Text style={styles.partnerStatValue}>{stats.nearbyPartners}</Text>
                  <Text style={styles.partnerStatLabel}>À proximité</Text>
                </View>
                <View style={styles.partnerStatCard}>
                  <View style={[styles.statIconWrapper, styles.statIconTertiary]}>
                    <Ionicons name="sparkles" size={18} color={Colors.accent.rose} />
                  </View>
                  <Text style={styles.partnerStatValue}>{stats.activePromotions}</Text>
                  <Text style={styles.partnerStatLabel}>Promos actives</Text>
                </View>
                <View style={styles.partnerStatCard}>
                  <View style={[styles.statIconWrapper, styles.statIconInfo]}>
                    <Ionicons name="star" size={18} color={Colors.status.warning} />
                  </View>
                  <Text style={styles.partnerStatValue}>{stats.averageRating.toFixed(1)}</Text>
                  <Text style={styles.partnerStatLabel}>Note moyenne</Text>
                </View>
              </View>
            </NeoCard>

            {/* Grille / liste de partenaires */}
            <Animated.View style={{ opacity: fadeAnim }}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary[500]} />
                  <Text style={styles.loadingText}>Chargement des partenaires…</Text>
                </View>
              ) : error ? (
                <View style={styles.emptyState}>
                  <Ionicons name="alert-circle" size={40} color={Colors.status.error} />
                  <Text style={styles.emptyStateTitle}>Erreur de chargement</Text>
                  <Text style={styles.emptyStateText}>{error}</Text>
                </View>
              ) : filteredPartners.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="search" size={40} color={Colors.text.secondary} />
                  <Text style={styles.emptyStateTitle}>Aucun partenaire trouvé</Text>
                  <Text style={styles.emptyStateText}>
                    Essaye de modifier ta recherche ou de changer de catégorie.
                  </Text>
                </View>
              ) : viewMode === 'grille' ? (
                <View style={styles.gridContainer}>
                  {sortedPartners.map((partner) => (
                    <PartnerCard
                      key={partner.id}
                      partner={partner}
                      onPress={() => handlePartnerSelect(partner)}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.listContainer}>
                  {sortedPartners.map((partner) => (
                    <TouchableOpacity
                      key={partner.id}
                      style={styles.listItem}
                      onPress={() => handlePartnerSelect(partner)}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={['rgba(71,17,38,0.85)', 'rgba(18,10,24,0.95)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.listItemBackground}
                      >
                        <View style={styles.listItemIcon}>
                          <Text style={styles.listItemEmoji}>{partner.image}</Text>
                        </View>
                        <View style={styles.listItemBody}>
                          <View style={styles.listItemHeader}>
                            <Text style={styles.listItemTitle}>{partner.name}</Text>
                            <View
                              style={[
                                styles.listItemStatus,
                                partner.isOpen ? styles.listItemStatusOpen : styles.listItemStatusClosed,
                              ]}
                            >
                              <Text style={styles.listItemStatusText}>
                                {partner.isOpen ? 'Ouvert' : 'Fermé'}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.listItemSubtitle}>{partner.category}</Text>
                          <View style={styles.listItemDetails}>
                            <Ionicons name="location" size={13} color={Colors.text.secondary} />
                            <Text style={styles.listItemAddress}>{partner.address}</Text>
                          </View>
                          {partner.promotion?.isActive && (
                            <View style={styles.listItemPromo}>
                              <Ionicons name="sparkles-outline" size={12} color={Colors.accent.gold} />
                              <Text style={styles.listItemPromoText}>{partner.promotion.discount}</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.listItemRight}>
                          <View style={styles.listItemRating}>
                            <Ionicons name="star" size={13} color={Colors.accent.gold} />
                            <Text style={styles.listItemRatingText}>{partner.rating.toFixed(1)}</Text>
                          </View>
                          <Text style={styles.listItemDistance}>
                            {partner.distance !== null ? `${partner.distance.toFixed(1)} km` : '—'}
                          </Text>
                          {partner.closingTime && (
                            <Text style={styles.listItemClosing}>Ferme à {partner.closingTime}</Text>
                          )}
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Animated.View>
          </ScrollView>
        </SafeAreaView>

        {showPartnerModal && (
          <Modal
            visible={showPartnerModal}
            transparent
            animationType="fade"
            onRequestClose={closePartnerModal}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Détails du partenaire</Text>
                  <TouchableOpacity onPress={closePartnerModal} style={styles.modalCloseBtn}>
                    <Ionicons name="close" size={20} color={Colors.text.light} />
                  </TouchableOpacity>
                </View>

                {detailLoading ? (
                  <View style={styles.modalLoading}>
                    <ActivityIndicator size="large" color={Colors.primary[500]} />
                    <Text style={styles.modalLoadingText}>Chargement des détails…</Text>
                  </View>
                ) : detailError ? (
                  <View style={styles.modalError}>
                    <Ionicons name="warning" size={18} color={Colors.status.error} />
                    <Text style={styles.modalErrorText}>{detailError}</Text>
                  </View>
                ) : (
                  selectedPartner && (
                    <View>
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
                          <Text style={styles.modalDistance}>
                            {selectedPartner.distance !== null
                              ? `${selectedPartner.distance.toFixed(1)} km`
                              : '—'}
                          </Text>
                        </View>
                        <View style={styles.modalStatus}>
                          <View
                            style={[
                              styles.modalStatusChip,
                              selectedPartner.isOpen ? styles.modalStatusOpen : styles.modalStatusClosed,
                            ]}
                          >
                            <Ionicons
                              name="time"
                              size={14}
                              color={selectedPartner.isOpen ? Colors.status.success : Colors.status.error}
                            />
                            <Text
                              style={[
                                styles.modalStatusText,
                                { color: selectedPartner.isOpen ? Colors.status.success : Colors.status.error },
                              ]}
                            >
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
                  )
                )}
              </View>
            </View>
          </Modal>
        )}
      </View>
    </NavigationTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  } as ViewStyle,
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  } as ViewStyle,
  safeArea: {
    flex: 1,
  } as ViewStyle,
  content: {
    flex: 1,
    gap: Spacing['2xl'],
    paddingBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
  } as ViewStyle,
  heroCard: {
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  } as ViewStyle,
  heroHeader: {
    gap: Spacing.xs,
  } as ViewStyle,
  heroTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
  heroSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  heroSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  } as ViewStyle,
  heroSummaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs / 2,
  } as ViewStyle,
  heroSummaryValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
  heroSummaryLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  } as TextStyle,
  heroDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.12)',
  } as ViewStyle,
  heroActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  } as ViewStyle,
  heroAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius['2xl'],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    backgroundColor: 'rgba(15,10,24,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  } as ViewStyle,
  heroActionActive: {
    backgroundColor: 'rgba(251,76,136,0.25)',
    borderColor: 'rgba(251,76,136,0.55)',
    shadowColor: Colors.accent.rose,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 6,
  } as ViewStyle,
  heroActionIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  heroActionTexts: {
    flex: 1,
  } as ViewStyle,
  heroActionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
  heroActionSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  } as TextStyle,
  discoveryCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
  } as ViewStyle,
  discoveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  } as ViewStyle,
  discoveryTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
    letterSpacing: Typography.letterSpacing.wide,
  } as TextStyle,
  discoverySubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs / 2,
  } as TextStyle,
  discoveryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm / 1.2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  } as ViewStyle,
  discoveryActionLabel: {
    color: Colors.text.light,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  discoveryList: {
    gap: Spacing.md,
    paddingRight: Spacing.lg,
  } as ViewStyle,
  discoveryItem: {
    width: 200,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginRight: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  } as ViewStyle,
  discoveryIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  discoveryEmoji: {
    fontSize: 26,
  } as TextStyle,
  discoveryItemInfo: {
    flex: 1,
    gap: Spacing.xs / 1.5,
  } as ViewStyle,
  discoveryItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  } as ViewStyle,
  discoveryName: {
    flex: 1,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
  discoveryRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
  } as ViewStyle,
  discoveryRatingText: {
    color: Colors.text.light,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  discoveryMeta: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  discoveryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  } as ViewStyle,
  discoveryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
    backgroundColor: 'rgba(17,17,23,0.55)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 1.2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  } as ViewStyle,
  discoveryChipText: {
    color: Colors.text.light,
    fontSize: Typography.sizes.xs,
  } as TextStyle,
  discoveryPromoChip: {
    backgroundColor: 'rgba(251,76,136,0.25)',
    borderColor: 'rgba(251,76,136,0.45)',
  } as ViewStyle,
  discoveryPromoText: {
    color: Colors.accent.gold,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold as any,
  } as TextStyle,
  searchSectionCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  } as ViewStyle,

  // Section recherche moderne
  searchSection: {
    gap: Spacing.md,
  } as ViewStyle,
  searchIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  } as ViewStyle,
  searchTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  } as TextStyle,
  searchSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginTop: Spacing.xs / 2,
  } as TextStyle,
  searchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
    backgroundColor: 'rgba(251,76,136,0.25)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(251,76,136,0.45)',
  } as ViewStyle,
  searchBadgeText: {
    color: Colors.text.light,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold as any,
  } as TextStyle,
  
  // Input de recherche moderne
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  } as ViewStyle,
  searchIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  } as ViewStyle,
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.light,
    padding: 0,
    fontWeight: '500',
  } as TextStyle,
  clearBtn: {
    padding: 4,
    marginLeft: Spacing.xs,
  } as ViewStyle,
  sortSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  } as ViewStyle,
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
    backgroundColor: 'rgba(24,17,34,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  } as ViewStyle,
  sortChipActive: {
    backgroundColor: 'rgba(251,76,136,0.22)',
    borderColor: 'rgba(251,76,136,0.45)',
    shadowColor: Colors.accent.rose,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  } as ViewStyle,
  sortChipIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  } as ViewStyle,
  sortChipTexts: {
    gap: Spacing.xs / 2,
  } as ViewStyle,
  sortChipLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  sortChipLabelActive: {
    color: Colors.text.light,
  } as TextStyle,
  sortChipHelper: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
  } as TextStyle,
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
  
  // Catégories modernes
  categoriesContainer: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
    paddingLeft: 2,
  } as ViewStyle,
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
  } as ViewStyle,
  categoryPillActive: {
    backgroundColor: 'rgba(251,76,136,0.25)',
  } as ViewStyle,
  categoryPillText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.muted,
    fontWeight: '600',
  } as TextStyle,
  categoryPillTextActive: {
    color: Colors.text.light,
  } as TextStyle,
  categoryIcon: {
    marginRight: Spacing.xs,
  } as TextStyle,
  
  // Toggle Vue
  viewToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(17,17,23,0.85)',
    borderRadius: BorderRadius.full,
    padding: 4,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
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
  viewToggleLabel: {
    marginTop: Spacing.xs / 2,
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
  } as TextStyle,
  viewToggleLabelActive: {
    color: Colors.text.light,
    fontWeight: Typography.weights.semibold as any,
  } as TextStyle,
  featuredCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  } as ViewStyle,
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  } as ViewStyle,
  featuredTitle: {
    fontSize: Typography.sizes.lg,
    color: Colors.text.light,
    fontWeight: Typography.weights.semibold as any,
  } as TextStyle,
  featuredSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  } as TextStyle,
  featuredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  } as ViewStyle,
  featuredButtonLabel: {
    color: Colors.text.light,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold as any,
  } as TextStyle,
  featuredChips: {
    flexDirection: 'row',
    gap: Spacing.sm,
  } as ViewStyle,
  featuredChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  } as ViewStyle,
  featuredChipText: {
    color: Colors.text.light,
    fontSize: Typography.sizes.xs,
  } as TextStyle,
  statsCard: {
    padding: Spacing.lg,
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
    backgroundColor: 'rgba(24,17,34,0.92)',
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
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
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    backgroundColor: 'rgba(39,239,161,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.status.success,
  } as ViewStyle,
  gridPromoBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.status.success,
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
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  } as ViewStyle,
  closeButton: {
    padding: Spacing.sm,
  } as ViewStyle,
  modalTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.light,
  } as TextStyle,
  modalContent: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: 'rgba(11,10,18,0.92)',
    borderRadius: BorderRadius['3xl'],
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: Spacing.lg,
    overflow: 'hidden',
  } as ViewStyle,
  modalLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: Spacing.sm,
  } as ViewStyle,
  modalLoadingText: {
    color: Colors.text.light,
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
    backgroundColor: 'rgba(255,107,107,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.35)',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
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
    gap: Spacing.md,
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
    backgroundColor: 'rgba(39,239,161,0.16)',
  } as ViewStyle,
  modalStatusClosed: {
    backgroundColor: 'rgba(255,107,107,0.16)',
  } as ViewStyle,
  modalStatusText: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
  } as TextStyle,
  modalClosingTime: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  } as TextStyle,
  modalPromotion: {
    backgroundColor: 'rgba(251,76,136,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251,76,136,0.35)',
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
    borderRadius: BorderRadius.full,
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
    backgroundColor: Colors.accent.rose,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius['2xl'],
    gap: Spacing.sm,
    shadowColor: Colors.accent.rose,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  } as ViewStyle,
  modalActionText: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.light,
  } as TextStyle,
  partnerStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  } as ViewStyle,
  partnerStatCard: {
    flexBasis: '48%',
    backgroundColor: 'rgba(24,17,34,0.8)',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: Spacing.sm,
  } as ViewStyle,
  statIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  statIconSecondary: {
    backgroundColor: 'rgba(45,217,255,0.12)',
  } as ViewStyle,
  statIconTertiary: {
    backgroundColor: 'rgba(255,107,107,0.15)',
  } as ViewStyle,
  statIconInfo: {
    backgroundColor: 'rgba(255,184,77,0.15)',
  } as ViewStyle,
  partnerStatValue: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: Colors.text.light,
  } as TextStyle,
  partnerStatLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.muted,
  } as TextStyle,
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.xs,
  } as ViewStyle,
  listContainer: {
    paddingBottom: Spacing.xl,
  } as ViewStyle,
  listItem: {
    marginBottom: Spacing.md,
  } as ViewStyle,
  listItemBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: Spacing.md,
    overflow: 'hidden',
  } as ViewStyle,
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  } as ViewStyle,
  listItemEmoji: {
    fontSize: 24,
  } as TextStyle,
  listItemBody: {
    flex: 1,
    gap: Spacing.xs,
  } as ViewStyle,
  listItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  } as ViewStyle,
  listItemTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.light,
  } as TextStyle,
  listItemSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.muted,
  } as TextStyle,
  listItemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  } as ViewStyle,
  listItemAddress: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.muted,
  } as TextStyle,
  listItemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 1.2,
    borderWidth: 1,
    gap: Spacing.xs / 2,
  } as ViewStyle,
  listItemStatusOpen: {
    backgroundColor: 'rgba(39,239,161,0.18)',
    borderColor: 'rgba(39,239,161,0.35)',
  } as ViewStyle,
  listItemStatusClosed: {
    backgroundColor: 'rgba(255,107,107,0.18)',
    borderColor: 'rgba(255,107,107,0.35)',
  } as ViewStyle,
  listItemStatusText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  } as TextStyle,
  listItemPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
    marginTop: Spacing.xs,
    backgroundColor: 'rgba(251,76,136,0.18)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 1.5,
    borderWidth: 1,
    borderColor: 'rgba(251,76,136,0.35)',
    alignSelf: 'flex-start',
  } as ViewStyle,
  listItemPromoText: {
    fontSize: Typography.sizes.xs,
    color: Colors.accent.gold,
    fontWeight: Typography.weights.semibold as any,
  } as TextStyle,
  listItemRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs / 2,
    marginLeft: Spacing.md,
  } as ViewStyle,
  listItemDistance: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '500',
  } as TextStyle,
  listItemRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  } as ViewStyle,
  listItemRatingText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.light,
  } as TextStyle,
  listItemClosing: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
  } as TextStyle,
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  } as ViewStyle,
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
});
