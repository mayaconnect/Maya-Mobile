import { NavigationTransition } from '@/components/common/navigation-transition';
import { PartnerCard } from '@/components/partners/partner-card';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { StoresService } from '@/services/stores.service';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { WebView } from 'react-native-webview';

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
  const [viewMode, setViewMode] = useState<'grille' | 'liste' | 'carte'>('grille');
  const [selectedPartner, setSelectedPartner] = useState<PartnerUI | null>(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [partners, setPartners] = useState<PartnerUI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [showViewMenu, setShowViewMenu] = useState(false);
  
  // États pour la carte
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [mapStores, setMapStores] = useState<PartnerUI[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 48.8566, // Paris par défaut
    longitude: 2.3522,
    latitudeDelta: 0.5, // ~50km
    longitudeDelta: 0.5,
  });
  
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

    const address = dto.address;

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
    // D'abord chercher une promotion active spécifique
    const promo = dto.activePromotion ?? dto.currentPromotion ?? dto.promotion;
    
    // Sinon, utiliser la réduction standard du magasin
    // L'API utilise avgDiscountPercent, discountPercent ou discount
    const discountPercent = dto.avgDiscountPercent ?? dto.discountPercent ?? dto.discount;
    
    // Si on a une promo active, l'utiliser
    if (promo) {
      return {
        discount: promo.discountLabel ?? promo.discount ?? promo.title ?? (discountPercent ? `-${discountPercent}%` : 'Promo'),
        description: promo.description ?? promo.details ?? 'Promotion disponible',
        isActive: promo.isActive ?? true,
      };
    }
    
    // Sinon, si le magasin a une réduction standard, l'afficher
    if (discountPercent != null && discountPercent > 0) {
      return {
        discount: `-${discountPercent}%`,
        description: `${discountPercent}% de réduction sur votre addition`,
        isActive: true,
      };
    }
    
    // Sinon, pas de promotion
    return null;
  }, []);

  const mapStore = useCallback((dto: any, index: number): PartnerUI => {
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

    // Récupérer les infos du partenaire depuis le store
    const partner = dto.partner ?? dto.partnerData;
    const partnerName = partner?.name ?? dto.partnerName ?? dto.name ?? 'Partenaire';
    const partnerDescription = partner?.description ?? dto.partnerDescription ?? dto.description ?? 'Partenaire du programme Maya';

    // Extraire les coordonnées pour la carte
    const latitude = dto.latitude ?? dto.address?.latitude ?? dto.location?.latitude ?? 
      (typeof dto.address === 'object' && dto.address?.lat) ?? null;
    const longitude = dto.longitude ?? dto.address?.longitude ?? dto.location?.longitude ?? 
      (typeof dto.address === 'object' && dto.address?.lng) ?? null;

    return {
      id: dto.id ?? dto.storeId ?? `store-${index}`,
      name: partnerName,
      description: partnerDescription,
      address: computeAddress(dto),
      distance: distanceValue,
      isOpen: dto.isOpen ?? dto.openNow ?? true,
      closingTime: dto.closingTime ?? dto.openingHours?.closing ?? null,
      category: computeCategory(dto),
      image,
      promotion: computePromotion(dto),
      rating: ratingValue,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
    } as PartnerUI & { latitude?: number; longitude?: number };
  }, [computeCategory, computeAddress, computePromotion]);

  useEffect(() => {
    let isMounted = true;

    const fetchStores = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await StoresService.searchStores();
        if (!isMounted) {
          return;
        }
        const list = response?.items ?? [];
        const mapped = list.map((store, index) => mapStore(store, index));
        setPartners(mapped);
      } catch (err) {
        console.error('Erreur lors du chargement des magasins:', err);
        if (isMounted) {
          setError('Impossible de récupérer les magasins pour le moment.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStores();
    return () => {
      isMounted = false;
    };
  }, [mapStore]);

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

  const handleViewToggle = (mode: 'grille' | 'liste' | 'carte') => {
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
    
    // Si on passe en mode carte, charger les stores avec géolocalisation
    if (mode === 'carte') {
      loadStoresNearby();
    }
  };

  // Récupérer la position actuelle
  const getCurrentLocation = useCallback(async () => {
    try {
      console.log('📍 [Partners] Récupération de la position...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      console.log('✅ [Partners] Position récupérée:', coords);
      setUserLocation(coords);
      
      // Mettre à jour la région de la carte
      setMapRegion({
        ...coords,
        latitudeDelta: 0.5, // ~50km
        longitudeDelta: 0.5,
      });
    } catch (error) {
      console.error('❌ [Partners] Erreur lors de la récupération de la position:', error);
      Alert.alert('Erreur', 'Impossible de récupérer votre position');
    }
  }, []);

  // Demander la permission de géolocalisation
  const requestLocationPermission = useCallback(async () => {
    try {
      console.log('📍 [Partners] Demande de permission de géolocalisation...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('📍 [Partners] Statut de permission:', status);
      
      if (status === 'granted') {
        setLocationPermission(true);
        await getCurrentLocation();
      } else {
        setLocationPermission(false);
        Alert.alert(
          'Permission requise',
          'La géolocalisation est nécessaire pour afficher les stores près de chez vous.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ [Partners] Erreur lors de la demande de permission:', error);
      setLocationPermission(false);
    }
  }, [getCurrentLocation]);

  // Charger les stores à proximité (50km max)
  const loadStoresNearby = useCallback(async () => {
    console.log('🗺️ [Partners] Chargement des stores à proximité...');
    
    setMapLoading(true);
    
    try {
      // Si pas de permission, la demander
      let currentPermission = locationPermission;
      if (!currentPermission) {
        console.log('📍 [Partners] Demande de permission...');
        const { status } = await Location.requestForegroundPermissionsAsync();
        currentPermission = status === 'granted';
        setLocationPermission(currentPermission);
        
        if (!currentPermission) {
          Alert.alert(
            'Permission requise',
            'La géolocalisation est nécessaire pour afficher les stores près de chez vous.',
            [{ text: 'OK' }]
          );
          setMapLoading(false);
          return;
        }
      }

      // Récupérer la position actuelle
      let currentLocation = userLocation;
      if (!currentLocation) {
        console.log('📍 [Partners] Récupération de la position...');
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          
          currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          
          console.log('✅ [Partners] Position récupérée:', currentLocation);
          setUserLocation(currentLocation);
          
          // Mettre à jour la région de la carte
          setMapRegion({
            ...currentLocation,
            latitudeDelta: 0.5, // ~50km
            longitudeDelta: 0.5,
          });
        } catch (error) {
          console.error('❌ [Partners] Erreur lors de la récupération de la position:', error);
          Alert.alert('Erreur', 'Impossible de récupérer votre position');
          setMapLoading(false);
          return;
        }
      }

      // Utiliser une position par défaut si toujours pas de position
      if (!currentLocation) {
        currentLocation = { latitude: 48.8566, longitude: 2.3522 };
        console.warn('⚠️ [Partners] Utilisation de la position par défaut (Paris)');
      }

      console.log('🔍 [Partners] Recherche de stores avec:', {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        radiusKm: 50,
      });

      const response = await StoresService.searchStores({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        radiusKm: 50,
        page: 1,
        pageSize: 100, // Récupérer jusqu'à 100 stores
      });

      console.log('✅ [Partners] Stores récupérés:', response.items.length);
      
      const mapped = response.items.map((store, index) => mapStore(store, index));
      setMapStores(mapped);
      
      console.log('✅ [Partners] Stores mappés pour la carte:', mapped.length);
    } catch (error) {
      console.error('❌ [Partners] Erreur lors du chargement des stores:', error);
      if (error instanceof Error && error.message.includes('401')) {
        Alert.alert(
          'Erreur d\'authentification',
          'Votre session a expiré. Veuillez vous reconnecter.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Erreur', 'Impossible de charger les stores à proximité');
      }
    } finally {
      setMapLoading(false);
    }
  }, [userLocation, locationPermission, mapStore]);

  // Charger la position au montage si on est en mode carte
  useEffect(() => {
    if (viewMode === 'carte') {
      requestLocationPermission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // Générer le HTML pour la carte avec OpenStreetMap (Leaflet) - gratuit, pas besoin de clé API
  const generateMapHTML = useCallback((userLoc: { latitude: number; longitude: number } | null, stores: PartnerUI[]) => {
    if (!userLoc) {
      return '<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial,sans-serif;"><p style="color:#666;">Chargement de la position...</p></body></html>';
    }

    const storesMarkers = stores
      .map((store) => {
        const storeWithCoords = store as PartnerUI & { latitude?: number; longitude?: number };
        if (!storeWithCoords.latitude || !storeWithCoords.longitude) return null;
        
        const color = store.isOpen ? '#10B981' : '#EF4444';
        const escapedName = store.name.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\n/g, ' ');
        const escapedAddress = (store.address || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\n/g, ' ');
        return `
          {
            lat: ${storeWithCoords.latitude},
            lng: ${storeWithCoords.longitude},
            title: "${escapedName}",
            description: "${escapedAddress}",
            color: "${color}",
            storeId: "${store.id}"
          }
        `;
      })
      .filter(Boolean)
      .join(',');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <style>
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
            #map { width: 100%; height: 100vh; }
            .leaflet-popup-content-wrapper {
              border-radius: 8px;
              padding: 0;
            }
            .leaflet-popup-content {
              margin: 0;
              padding: 12px;
            }
            .store-popup h3 {
              margin: 0 0 6px 0;
              font-size: 16px;
              font-weight: 600;
              color: #1F2937;
            }
            .store-popup p {
              margin: 0;
              font-size: 14px;
              color: #6B7280;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <script>
            // Initialiser la carte
            const userLocation = [${userLoc.latitude}, ${userLoc.longitude}];
            const map = L.map('map').setView(userLocation, 11);

            // Ajouter les tuiles OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              maxZoom: 19,
            }).addTo(map);

            // Marqueur utilisateur (icône personnalisée)
            const userIcon = L.divIcon({
              className: 'user-marker',
              html: '<div style="background-color: #8B2F3F; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(139, 47, 63, 0.5);"></div>',
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            });

            L.marker(userLocation, { icon: userIcon })
              .addTo(map)
              .bindPopup('<b>Votre position</b><br>Vous êtes ici');

            // Marqueurs des stores
            const stores = [${storesMarkers}];
            stores.forEach((store) => {
              const storeIcon = L.divIcon({
                className: 'store-marker',
                html: '<div style="background-color: ' + store.color + '; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">🏪</div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              });

              const marker = L.marker([store.lat, store.lng], { icon: storeIcon })
                .addTo(map);

              const popupContent = '<div class="store-popup"><h3>' + store.title + '</h3><p>' + store.description + '</p></div>';
              
              marker.bindPopup(popupContent);

              marker.on('click', () => {
                // Envoyer un message à React Native
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'storeClick',
                    storeId: store.storeId
                  }));
                }
              });
            });
          </script>
        </body>
      </html>
    `;
  }, []);

  const handlePartnerSelect = async (partner: PartnerUI) => {
    setSelectedPartner(partner);
    setShowPartnerModal(true);
    setDetailError('');
    setDetailLoading(true);

    try {
      const detailDto = await StoresService.getStoreById(partner.id);
      const mapped = mapStore(detailDto, 0);
      setSelectedPartner(mapped);
    } catch (err) {
      console.error('Erreur lors du chargement du magasin:', err);
      setDetailError('Impossible de charger les détails du magasin.');
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
    <NavigationTransition children={<></>}  >
      <LinearGradient
        colors={Colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerTextContainer}>
                <View style={styles.titleRow}>
                  <Ionicons name="business" size={28} color="#F6C756" style={styles.titleIcon} />
                  <Text style={styles.title}>Explorer</Text>
                </View>
                <Text style={styles.subtitle}>Trouvez vos partenaires Maya</Text>
              </View>
              <View style={styles.headerActions}>
               
                {/* Sélecteur de vue */}
                <View style={styles.viewSelectorContainer}>
                  <TouchableOpacity
                    style={styles.viewSelectorButton}
                    onPress={() => setShowViewMenu(!showViewMenu)}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name={viewMode === 'grille' ? 'grid' : viewMode === 'liste' ? 'list' : 'map'} 
                      size={20} 
                      color={Colors.text.light} 
                    />
                    <Ionicons name="chevron-down" size={16} color={Colors.text.secondary} />
                  </TouchableOpacity>
                  
                  {showViewMenu && (
                    <View style={styles.viewMenu}>
                      <TouchableOpacity
                        style={[styles.viewMenuItem, viewMode === 'grille' && styles.viewMenuItemActive]}
                        onPress={() => {
                          handleViewToggle('grille');
                          setShowViewMenu(false);
                        }}
                      >
                        <Ionicons 
                          name="grid" 
                          size={18} 
                          color={viewMode === 'grille' ? Colors.text.light : Colors.text.secondary} 
                        />
                        <Text style={[styles.viewMenuText, viewMode === 'grille' && styles.viewMenuTextActive]}>
                          Grille
                        </Text>
                        {viewMode === 'grille' && (
                          <Ionicons name="checkmark" size={18} color={Colors.text.light} />
                        )}
                      </TouchableOpacity>
                      
                      <View style={styles.viewMenuDivider} />
                      
                      <TouchableOpacity
                        style={[styles.viewMenuItem, viewMode === 'liste' && styles.viewMenuItemActive]}
                        onPress={() => {
                          handleViewToggle('liste');
                          setShowViewMenu(false);
                        }}
                      >
                        <Ionicons 
                          name="list" 
                          size={18} 
                          color={viewMode === 'liste' ? Colors.text.light : Colors.text.secondary} 
                        />
                        <Text style={[styles.viewMenuText, viewMode === 'liste' && styles.viewMenuTextActive]}>
                          Liste
                        </Text>
                        {viewMode === 'liste' && (
                          <Ionicons name="checkmark" size={18} color={Colors.text.light} />
                        )}
                      </TouchableOpacity>
                      
                      <View style={styles.viewMenuDivider} />
                      
                      <TouchableOpacity
                        style={[styles.viewMenuItem, viewMode === 'carte' && styles.viewMenuItemActive]}
                        onPress={() => {
                          handleViewToggle('carte');
                          setShowViewMenu(false);
                        }}
                      >
                        <Ionicons 
                          name="map" 
                          size={18} 
                          color={viewMode === 'carte' ? Colors.text.light : Colors.text.secondary} 
                        />
                        <Text style={[styles.viewMenuText, viewMode === 'carte' && styles.viewMenuTextActive]}>
                          Carte
                        </Text>
                        {viewMode === 'carte' && (
                          <Ionicons name="checkmark" size={18} color={Colors.text.light} />
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Recherche moderne */}
          <View style={styles.searchSection}>
          {/* Input de recherche moderne avec gradient */}
          <LinearGradient
            colors={['rgba(139, 47, 63, 0.15)', 'rgba(139, 47, 63, 0.08)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.searchInputContainer}
          >
            <View style={styles.searchIconWrapper}>
              <Ionicons name="search" size={20} color="#8B2F3F" />
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
                <Ionicons name="close-circle" size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            )}
          </LinearGradient>
          
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
                  onPress={() => handleCategoryChange(category)}
                  activeOpacity={0.7}
                >
                  {isActive ? (
                    <LinearGradient
                      colors={['#8B2F3F', '#6B1F2F']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.categoryPill, styles.categoryPillActive]}
                    >
                      <Ionicons 
                        name={getIcon() as any} 
                        size={16} 
                        color="white" 
                        style={styles.categoryIcon}
                      />
                      <Text style={styles.categoryPillTextActive}>
                        {category}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.categoryPill}>
                      <Ionicons 
                        name={getIcon() as any} 
                        size={14} 
                        color={Colors.text.secondary} 
                        style={styles.categoryIcon}
                      />
                      <Text style={styles.categoryPillText}>
                        {category}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Contenu principal */}
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

          {/* Contenu conditionnel : Grille, Liste ou Carte */}
          {viewMode === 'carte' ? (
            /* Vue Carte */
            <View style={styles.mapContainer}>
              {mapLoading ? (
                <View style={styles.mapLoadingContainer}>
                  <ActivityIndicator size="large" color="#8B2F3F" />
                  <Text style={styles.mapLoadingText}>Chargement des stores à proximité...</Text>
                </View>
              ) : !userLocation ? (
                <View style={styles.mapLoadingContainer}>
                  <Ionicons name="location-outline" size={48} color={Colors.text.secondary} />
                  <Text style={styles.mapLoadingText}>Activation de la géolocalisation...</Text>
                  <TouchableOpacity 
                    style={styles.locationButton}
                    onPress={requestLocationPermission}
                  >
                    <Text style={styles.locationButtonText}>Autoriser la géolocalisation</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <WebView
                    style={styles.map}
                    source={{
                      html: generateMapHTML(userLocation, mapStores),
                    }}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    onMessage={(event) => {
                      // Gérer les clics sur les stores depuis la WebView
                      const data = JSON.parse(event.nativeEvent.data);
                      if (data.type === 'storeClick' && data.storeId) {
                        const store = mapStores.find(s => s.id === data.storeId);
                        if (store) {
                          handlePartnerSelect(store);
                        }
                      }
                    }}
                  />

                  {/* Contrôles de la carte */}
                  <View style={styles.mapControls}>
                    <TouchableOpacity 
                      style={styles.mapControlButton}
                      onPress={getCurrentLocation}
                    >
                      <Ionicons name="locate" size={24} color="#8B2F3F" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.mapControlButton}
                      onPress={loadStoresNearby}
                    >
                      <Ionicons name="refresh" size={24} color="#8B2F3F" />
                    </TouchableOpacity>
                  </View>

                  {/* Info sur les stores */}
                  <View style={styles.mapInfo}>
                    <Text style={styles.mapInfoText}>
                      {mapStores.length} store{mapStores.length > 1 ? 's' : ''} dans un rayon de 50km
                    </Text>
                  </View>
                </>
              )}
            </View>
          ) : viewMode === 'grille' ? (
            /* Grille des partenaires */
            <View style={styles.partnersGrid}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.partnersGridContent}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8B2F3F" />
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
                  <ActivityIndicator size="large" color="#8B2F3F" />
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
          <LinearGradient
            colors={Colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalContainer}
          >
            <SafeAreaView style={styles.modalSafeArea}>
              {/* Header sans démarcation */}
              <View style={styles.modalHeader}>
                <TouchableOpacity 
                  style={styles.closeButton} 
                  onPress={closePartnerModal}
                  activeOpacity={0.7}
                >
                  <View style={styles.closeButtonInner}>
                    <Ionicons name="close" size={22} color={Colors.text.light} />
                  </View>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Détails du partenaire</Text>
                <View style={styles.headerSpacer} />
              </View>
              
              <ScrollView 
                style={styles.modalScrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalContentContainer}
              >
                {selectedPartner && (
                  <>
                    {detailLoading && (
                      <View style={styles.modalLoading}>
                        <ActivityIndicator size="small" color="#8B2F3F" />
                        <Text style={styles.modalLoadingText}>Actualisation…</Text>
                      </View>
                    )}
                    {!!detailError && (
                      <View style={styles.modalError}>
                        <Ionicons name="alert-circle" size={18} color={Colors.status.error} />
                        <Text style={styles.modalErrorText}>{detailError}</Text>
                      </View>
                    )}

                    {/* Hero Section avec Image */}
                    <View style={styles.modalHeroSection}>
                      <LinearGradient
                        colors={['rgba(139, 47, 63, 0.4)', 'rgba(139, 47, 63, 0.2)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.modalImageContainer}
                      >
                        <View style={styles.modalImageWrapper}>
                          <Ionicons 
                            name="storefront" 
                            size={48} 
                            color="rgba(255, 255, 255, 0.9)" 
                          />
                        </View>
                        {selectedPartner.promotion?.isActive && (
                          <LinearGradient
                            colors={[Colors.status.success, '#059669']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.modalImagePromoBadge}
                          >
                            <Ionicons name="pricetag" size={14} color={Colors.text.light} />
                            <Text style={styles.modalImagePromoText}>
                              {selectedPartner.promotion.discount}
                            </Text>
                          </LinearGradient>
                        )}
                      </LinearGradient>

                      {/* Info principale avec badges */}
                      <View style={styles.modalHeroInfo}>
                        <View style={styles.modalNameRow}>
                          <Text style={styles.modalName} numberOfLines={2}>
                            {selectedPartner.name}
                          </Text>
                        </View>
                        
                        <View style={styles.modalBadgesRow}>
                          {/* Rating Badge */}
                          <LinearGradient
                            colors={['rgba(251, 191, 36, 0.2)', 'rgba(251, 191, 36, 0.1)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.modalRatingBadge}
                          >
                            <Ionicons name="star" size={16} color={Colors.accent.gold} />
                            <Text style={styles.modalRatingText}>
                              {selectedPartner.rating?.toFixed(1) || '4.0'}
                            </Text>
                          </LinearGradient>

                          {/* Category Badge */}
                          <View style={styles.modalCategoryBadge}>
                            <Ionicons name="pricetag-outline" size={14} color={Colors.text.light} />
                            <Text style={styles.modalCategoryText}>
                              {selectedPartner.category}
                            </Text>
                          </View>

                          {/* Status Badge */}
                          <View style={[
                            styles.modalQuickStatusBadge,
                            selectedPartner.isOpen ? styles.modalQuickStatusOpen : styles.modalQuickStatusClosed
                          ]}>
                            <View style={[
                              styles.modalQuickStatusDot,
                              { backgroundColor: selectedPartner.isOpen ? Colors.status.success : Colors.status.error }
                            ]} />
                            <Text style={[
                              styles.modalQuickStatusText,
                              { color: selectedPartner.isOpen ? Colors.status.success : Colors.status.error }
                            ]}>
                              {selectedPartner.isOpen ? 'Ouvert' : 'Fermé'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    
                    {/* Carte de description */}
                    <View style={styles.modalDescriptionCard}>
                      <View style={styles.modalSectionHeader}>
                        <Ionicons name="information-circle" size={20} color="#8B2F3F" />
                        <Text style={styles.modalSectionTitle}>À propos</Text>
                      </View>
                      <Text style={styles.modalDescription}>{selectedPartner.description}</Text>
                    </View>
                    
                    {/* Cartes d'informations en grille */}
                    <View style={styles.modalInfoGrid}>
                      {/* Carte de localisation */}
                      <View style={styles.modalInfoGridCard}>
                        <View style={styles.modalInfoGridIcon}>
                          <LinearGradient
                            colors={['rgba(139, 47, 63, 0.3)', 'rgba(139, 47, 63, 0.2)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.modalInfoGridIconInner}
                          >
                            <Ionicons name="location" size={24} color="#8B2F3F" />
                          </LinearGradient>
                        </View>
                        <Text style={styles.modalInfoGridLabel}>Adresse</Text>
                        <Text style={styles.modalInfoGridValue} numberOfLines={2}>
                          {selectedPartner.address}
                        </Text>
                        {selectedPartner.distance !== null && (
                          <View style={styles.modalDistanceBadgeInline}>
                            <Ionicons name="walk" size={12} color="#8B2F3F" />
                            <Text style={styles.modalDistanceInline}>
                              {selectedPartner.distance.toFixed(1)} km
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Carte de statut */}
                      <View style={styles.modalInfoGridCard}>
                        <View style={styles.modalInfoGridIcon}>
                          <LinearGradient
                            colors={
                              selectedPartner.isOpen 
                                ? ['rgba(16, 185, 129, 0.3)', 'rgba(16, 185, 129, 0.2)']
                                : ['rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.2)']
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.modalInfoGridIconInner}
                          >
                            <Ionicons 
                              name="time-outline" 
                              size={24} 
                              color={selectedPartner.isOpen ? Colors.status.success : Colors.status.error} 
                            />
                          </LinearGradient>
                        </View>
                        <Text style={styles.modalInfoGridLabel}>Statut</Text>
                        <View style={styles.modalStatusInlineWrapper}>
                          <View style={[
                            styles.modalStatusDotInline,
                            { backgroundColor: selectedPartner.isOpen ? Colors.status.success : Colors.status.error }
                          ]} />
                          <Text style={[
                            styles.modalInfoGridValue,
                            { color: selectedPartner.isOpen ? Colors.status.success : Colors.status.error }
                          ]}>
                            {selectedPartner.isOpen ? 'Ouvert' : 'Fermé'}
                          </Text>
                        </View>
                        {selectedPartner.isOpen && selectedPartner.closingTime && (
                          <Text style={styles.modalClosingTimeInline}>
                            Ferme à {selectedPartner.closingTime}
                          </Text>
                        )}
                      </View>
                    </View>
                    
                    {/* Promotion avec design premium */}
                    {selectedPartner.promotion && selectedPartner.promotion.isActive && (
                      <View style={styles.modalPromotionWrapper}>
                        <LinearGradient
                          colors={['rgba(16, 185, 129, 0.25)', 'rgba(16, 185, 129, 0.15)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.modalPromotion}
                        >
                          <View style={styles.modalPromotionHeader}>
                            <View style={styles.modalPromotionIconWrapper}>
                              <LinearGradient
                                colors={[Colors.status.success, '#059669']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.modalPromotionIcon}
                              >
                                <Ionicons name="gift" size={24} color={Colors.text.light} />
                              </LinearGradient>
                            </View>
                            <View style={styles.modalPromotionHeaderText}>
                              <Text style={styles.modalPromotionTitle}>🎉 Promotion active</Text>
                              <LinearGradient
                                colors={[Colors.status.success, '#059669']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.modalPromotionTag}
                              >
                                <Ionicons name="pricetag" size={14} color={Colors.text.light} />
                                <Text style={styles.modalPromotionDiscount}>
                                  {selectedPartner.promotion.discount}
                                </Text>
                              </LinearGradient>
                            </View>
                          </View>
                          <Text style={styles.modalPromotionText}>
                            {selectedPartner.promotion.description}
                          </Text>
                        </LinearGradient>
                      </View>
                    )}

                    {/* Bouton d'action dans le scroll */}
                    {selectedPartner && (
                      <View style={styles.modalActionWrapper}>
                        <TouchableOpacity 
                          style={styles.modalActionButton}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={['#8B2F3F', '#6B1F2F']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.modalActionGradient}
                          >
                            <View style={styles.modalActionContent}>
                              <View style={styles.modalActionIconCircle}>
                                <Ionicons name="navigate" size={24} color={Colors.text.light} />
                              </View>
                              <Text style={styles.modalActionText}>Y aller maintenant</Text>
                              <Ionicons name="chevron-forward" size={24} color={Colors.text.light} />
                            </View>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </ScrollView>
            </SafeAreaView>
          </LinearGradient>
        </Modal>
        </SafeAreaView>
      </LinearGradient>
    </NavigationTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  } as ViewStyle,
  safeArea: {
    flex: 1,
  } as ViewStyle,
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  } as ViewStyle,
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  } as ViewStyle,
  headerTextContainer: {
    flex: 1,
  } as ViewStyle,
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  } as ViewStyle,
  titleIcon: {
    marginBottom: 4,
  } as TextStyle,
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: '900',
    color: Colors.text.light,
    letterSpacing: -1,
  } as TextStyle,
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '500',
    marginTop: 2,
  } as TextStyle,
  resultsBadge: {
    backgroundColor: 'rgba(139, 47, 63, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(139, 47, 63, 0.5)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  } as ViewStyle,
  resultsBadgeText: {
    fontSize: Typography.sizes.lg,
    fontWeight: '900',
    color: Colors.text.light,
    letterSpacing: -0.5,
  } as TextStyle,
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  } as ViewStyle,
  viewSelectorContainer: {
    position: 'relative',
    zIndex: 10,
  } as ViewStyle,
  viewSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadows.md,
  } as ViewStyle,
  viewMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: Spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xs,
    minWidth: 160,
    ...Shadows.xl,
    zIndex: 1000,
  } as ViewStyle,
  viewMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  } as ViewStyle,
  viewMenuItemActive: {
    backgroundColor: 'rgba(139, 47, 63, 0.3)',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 47, 63, 0.5)',
  } as ViewStyle,
  viewMenuText: {
    flex: 1,
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.secondary,
  } as TextStyle,
  viewMenuTextActive: {
    color: Colors.text.light,
    fontWeight: '700',
  } as TextStyle,
  viewMenuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: Spacing.xs,
  } as ViewStyle,
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  } as ViewStyle,
  // Section recherche moderne
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  } as ViewStyle,
  
  // Input de recherche moderne
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    ...Shadows.lg,
  } as ViewStyle,
  searchIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(139, 47, 63, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 47, 63, 0.5)',
    ...Shadows.sm,
  } as ViewStyle,
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.base + 1,
    color: Colors.text.light,
    padding: 0,
    fontWeight: '600',
    letterSpacing: -0.2,
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
    color: Colors.text.light,
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
    paddingVertical: Spacing.xs,
  } as ViewStyle,
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    minHeight: 42,
    gap: Spacing.xs + 2,
    ...Shadows.sm,
  } as ViewStyle,
  categoryPillActive: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Shadows.lg,
  } as ViewStyle,
  categoryPillText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.text.secondary,
    letterSpacing: 0.2,
  } as TextStyle,
  categoryPillTextActive: {
    color: 'white',
    fontWeight: '800',
    letterSpacing: 0.3,
  } as TextStyle,
  categoryIcon: {
    marginRight: 4,
  } as TextStyle,
  
  
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
    color: Colors.text.light,
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
    color: Colors.text.light,
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
  
  // Carte
  mapContainer: {
    flex: 1,
    height: 600,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    ...Shadows.md,
  } as ViewStyle,
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  } as ViewStyle,
  mapLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
    minHeight: 400,
  } as ViewStyle,
  mapLoadingText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  } as TextStyle,
  locationButton: {
    backgroundColor: '#8B2F3F',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
    shadowColor: '#8B2F3F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  } as ViewStyle,
  locationButtonText: {
    color: 'white',
    fontSize: Typography.sizes.base,
    fontWeight: '600',
  } as TextStyle,
  mapControls: {
    position: 'absolute',
    right: Spacing.md,
    top: Spacing.md,
    gap: Spacing.sm,
  } as ViewStyle,
  mapControlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  } as ViewStyle,
  mapInfo: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  } as ViewStyle,
  mapInfoText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.light,
    fontWeight: '600',
    textAlign: 'center',
  } as TextStyle,
  userMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B2F3F',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    ...Shadows.md,
  } as ViewStyle,
  storeMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    ...Shadows.md,
  } as ViewStyle,
  storeMarkerOpen: {
    backgroundColor: Colors.status.success,
  } as ViewStyle,
  storeMarkerClosed: {
    backgroundColor: Colors.status.error,
  } as ViewStyle,
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
  } as ViewStyle,
  modalSafeArea: {
    flex: 1,
  } as ViewStyle,
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 0,
  } as ViewStyle,
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  closeButtonInner: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  modalTitle: {
    flex: 1,
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.light,
    textAlign: 'center',
    marginHorizontal: Spacing.md,
  } as TextStyle,
  headerSpacer: {
    width: 40,
  } as ViewStyle,
  modalScrollView: {
    flex: 1,
  } as ViewStyle,
  modalContentContainer: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  } as ViewStyle,
  modalLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
  // Hero Section
  modalHeroSection: {
    marginBottom: Spacing.xl,
    gap: Spacing.lg,
  } as ViewStyle,
  modalImageContainer: {
    width: 140,
    height: 140,
    borderRadius: BorderRadius['3xl'],
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    position: 'relative',
    overflow: 'visible',
    ...Shadows.xl,
  } as ViewStyle,
  modalImageWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius['3xl'],
  } as ViewStyle,
  modalImagePromoBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: 4,
    borderWidth: 3,
    borderColor: '#1A0A0E',
    ...Shadows.xl,
  } as ViewStyle,
  modalImagePromoText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '900',
    color: Colors.text.light,
    letterSpacing: 0.5,
  } as TextStyle,
  
  // Hero Info
  modalHeroInfo: {
    gap: Spacing.md,
  } as ViewStyle,
  modalNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  } as ViewStyle,
  modalName: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: '900',
    color: Colors.text.light,
    textAlign: 'center',
    letterSpacing: -0.8,
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  } as TextStyle,
  modalVerifiedBadge: {
    marginLeft: -Spacing.xs,
  } as ViewStyle,
  modalBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
  } as ViewStyle,
  modalRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    ...Shadows.sm,
  } as ViewStyle,
  modalRatingText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '800',
    color: Colors.accent.gold,
  } as TextStyle,
  modalCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 47, 63, 0.25)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 47, 63, 0.4)',
  } as ViewStyle,
  modalCategoryText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.light,
    fontWeight: '700',
    letterSpacing: 0.3,
  } as TextStyle,
  modalQuickStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
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
  
  // Description Card
  modalDescriptionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  } as ViewStyle,
  modalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  } as ViewStyle,
  modalSectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.light,
    letterSpacing: -0.3,
  } as TextStyle,
  modalDescription: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    lineHeight: 24,
    fontWeight: '400',
  } as TextStyle,
  modalLocationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  } as ViewStyle,
  modalLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  } as ViewStyle,
  modalLocationTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.light,
  } as TextStyle,
  modalAddress: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  } as TextStyle,
  modalDistanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139, 47, 63, 0.25)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(139, 47, 63, 0.4)',
  } as ViewStyle,
  modalDistance: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: '#8B2F3F',
  } as TextStyle,
  modalStatusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  } as ViewStyle,
  modalStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  } as ViewStyle,
  modalStatusTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.text.light,
  } as TextStyle,
  modalStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    alignSelf: 'flex-start',
  } as ViewStyle,
  modalStatusOpen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  } as ViewStyle,
  modalStatusClosed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  } as ViewStyle,
  modalStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  } as ViewStyle,
  modalStatusText: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
  } as TextStyle,
  modalClosingTime: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '500',
  } as TextStyle,
  
  // Info Grid (nouveau design)
  modalInfoGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  } as ViewStyle,
  modalInfoGridCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
    alignItems: 'center',
  } as ViewStyle,
  modalInfoGridIcon: {
    marginBottom: Spacing.md,
  } as ViewStyle,
  modalInfoGridIconInner: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  modalInfoGridLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  } as TextStyle,
  modalInfoGridValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.text.light,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,
  modalDistanceBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 47, 63, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
    marginTop: Spacing.xs,
  } as ViewStyle,
  modalDistanceInline: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    color: '#8B2F3F',
  } as TextStyle,
  modalStatusInlineWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,
  modalStatusDotInline: {
    width: 8,
    height: 8,
    borderRadius: 4,
  } as ViewStyle,
  modalClosingTimeInline: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: '500',
    marginTop: Spacing.xs,
    textAlign: 'center',
  } as TextStyle,
  
  modalPromotion: {
    borderWidth: 2,
    borderColor: Colors.status.success,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  } as ViewStyle,
  modalPromotionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  } as ViewStyle,
  modalPromotionTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    minWidth: 60,
    alignItems: 'center',
    ...Shadows.sm,
  } as ViewStyle,
  modalPromotionDiscount: {
    fontSize: Typography.sizes.base,
    fontWeight: '800',
    color: Colors.text.light,
  } as TextStyle,
  modalPromotionInfo: {
    flex: 1,
  } as ViewStyle,
  modalPromotionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.status.success,
    marginBottom: 2,
  } as TextStyle,
  modalPromotionText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.light,
    fontWeight: '500',
    lineHeight: 20,
  } as TextStyle,
  modalActionWrapper: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  } as ViewStyle,
  modalActionButton: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    ...Shadows.lg,
  } as ViewStyle,
  modalActionGradient: {
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
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
    fontWeight: '800',
    color: Colors.text.light,
    letterSpacing: 0.3,
  } as TextStyle,
});
