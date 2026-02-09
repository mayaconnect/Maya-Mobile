import { NavigationTransition } from '@/components/common/navigation-transition';
import { NeoCard } from '@/components/neo/NeoCard';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { mapStoreToPartner } from '@/features/partners/utils/partnerMapper';
import { getRestaurantImage } from '@/features/partners/utils/restaurantImages';
import { StoresApi } from '@/features/stores-map/services/storesApi';
import { responsiveSpacing } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  ViewStyle
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

interface Store {
  id: string;
  name: string;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  };
  partner?: {
    name?: string;
  };
  category?: string;
  distance?: number;
}

export default function StoresMapScreen() {
  const insets = useSafeAreaInsets();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [mapKey, setMapKey] = useState(Date.now());
  const [radiusKm, setRadiusKm] = useState(1000); // Rayon par défaut : 1000km
  const [showRadiusSelector, setShowRadiusSelector] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (userLocation) {
      loadStoresNearby();
    }
  }, [userLocation, radiusKm]);

  const requestLocationPermission = async () => {
    try {
      console.log('📍 [Stores Map] Demande de permission de localisation...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.warn('⚠️ [Stores Map] Permission de localisation refusée');
        Alert.alert(
          'Permission requise',
          'La localisation est nécessaire pour afficher les stores proches de vous.',
          [{ text: 'OK' }]
        );
        // Utiliser une position par défaut (Paris)
        setUserLocation({ latitude: 48.8566, longitude: 2.3522 });
        return;
      }

      console.log('✅ [Stores Map] Permission accordée, récupération de la position...');
      getCurrentLocation();
    } catch (error) {
      console.error('❌ [Stores Map] Erreur lors de la demande de permission:', error);
      // Position par défaut
      setUserLocation({ latitude: 48.8566, longitude: 2.3522 });
    }
  };

  const getCurrentLocation = async () => {
    try {
      console.log('📍 [Stores Map] Récupération de la position actuelle...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      console.log('✅ [Stores Map] Position récupérée:', coords);
      setUserLocation(coords);
    } catch (error) {
      console.error('❌ [Stores Map] Erreur lors de la récupération de la position:', error);
      Alert.alert('Erreur', 'Impossible de récupérer votre position. Utilisation d\'une position par défaut.');
      setUserLocation({ latitude: 48.8566, longitude: 2.3522 });
    }
  };

  const loadStoresNearby = async () => {
    if (!userLocation) return;

    try {
      setLoading(true);
      console.log('🔍 [Stores Map] Recherche des stores proches...', {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radiusKm: radiusKm,
      });

      const response = await StoresApi.searchStores({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radiusKm: radiusKm,
        pageSize: 100,
      });

      console.log('✅ [Stores Map] Stores récupérés:', response.items.length);
      // Trier les stores du plus proche au plus loin
      const sortedStores = (response.items || []).sort((a, b) => {
        const distanceA = a.distance ?? a.distanceKm ?? a.distanceKM ?? Infinity;
        const distanceB = b.distance ?? b.distanceKm ?? b.distanceKM ?? Infinity;
        return distanceA - distanceB;
      });
      console.log('🔍 [Stores Map] Stores triés - Distances:', sortedStores.slice(0, 5).map(s => ({ name: s.name, distance: s.distance ?? s.distanceKm ?? s.distanceKM })));
      setStores(sortedStores);
    } catch (error) {
      console.error('❌ [Stores Map] Erreur lors du chargement des stores:', error);
      Alert.alert('Erreur', 'Impossible de charger les stores proches.');
    } finally {
      setLoading(false);
    }
  };

  const generateMapHTML = () => {
    if (!userLocation) return '';

    const storesMarkers = stores
      .filter((store) => store.address?.latitude && store.address?.longitude)
      .map((store, index) => {
        const lat = store.address!.latitude!;
        const lng = store.address!.longitude!;
        const name = (store.name || store.partner?.name || 'Store').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const address = (store.address?.street || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        return `
          L.marker([${lat}, ${lng}], {
            icon: L.divIcon({
              className: 'store-marker',
              html: '<div style="background-color: #8B2F3F; width: 32px; height: 32px; border-radius: 50%; border: 3px solid #1A0A0E; box-shadow: 0 4px 12px rgba(139, 47, 63, 0.5); display: flex; align-items: center; justify-content: center;"><div style="width: 12px; height: 12px; background: white; border-radius: 50%;"></div></div>',
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            }),
            storeId: '${store.id}'
          })
            .addTo(map)
            .bindPopup(
              '<div style="background: #1A0A0E; color: white; padding: 12px; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; min-width: 200px; cursor: pointer;">' +
              '<b style="color: #8B2F3F; font-size: 16px; display: block; margin-bottom: 6px;">${name}</b>' +
              '<span style="color: #cccccc; font-size: 14px;">${address}</span>' +
              '</div>',
              { className: 'custom-popup', closeOnClick: false }
            )
            .on('click', function(e) {
              e.originalEvent.stopPropagation();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'storeSelected',
                storeId: '${store.id}',
                storeName: '${name}'
              }));
            })
            .on('popupopen', function() {
              // Quand le popup s'ouvre, on sélectionne aussi le store
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'storeSelected',
                storeId: '${store.id}',
                storeName: '${name}'
              }));
            })
            .on('popupclick', function() {
              // Clic direct sur le popup
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'storeSelected',
                storeId: '${store.id}',
                storeName: '${name}'
              }));
            });
        `;
      })
      .join('\n');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              margin: 0; 
              padding: 0; 
              background: #2A1A1E;
              overflow: hidden;
            }
            #map { 
              width: 100%; 
              height: 100vh; 
              background: #2A1A1E;
            }
            
            /* Style personnalisé pour les popups */
            .leaflet-popup-content-wrapper {
              background: transparent !important;
              box-shadow: none !important;
              padding: 0 !important;
              cursor: pointer !important;
            }
            .leaflet-popup-content {
              margin: 0 !important;
              cursor: pointer !important;
            }
            .leaflet-popup-content-wrapper:hover {
              opacity: 0.9 !important;
            }
            .leaflet-popup-tip {
              background: #1A0A0E !important;
            }
            .leaflet-popup-close-button {
              color: #8B2F3F !important;
              font-size: 24px !important;
              padding: 8px !important;
            }
            .leaflet-popup-close-button:hover {
              color: #FF6B6B !important;
            }
            
            /* Contrôles de zoom personnalisés avec effet 3D */
            .leaflet-control-zoom a {
              background: rgba(26, 10, 14, 0.95) !important;
              color: #8B2F3F !important;
              border: 1px solid rgba(139, 47, 63, 0.4) !important;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
              transition: all 0.2s ease !important;
            }
            .leaflet-control-zoom a:hover {
              background: rgba(139, 47, 63, 0.3) !important;
              color: #FF6B6B !important;
              transform: translateY(-1px) !important;
              box-shadow: 0 6px 16px rgba(139, 47, 63, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
            }
            .leaflet-control-zoom a:active {
              transform: translateY(0) !important;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
            }
            
            /* Attribution personnalisée */
            .leaflet-control-attribution {
              background: rgba(26, 10, 14, 0.8) !important;
              color: #cccccc !important;
              font-size: 11px !important;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            // Initialiser la carte avec vue centrée
            const map = L.map('map', {
              center: [${userLocation.latitude}, ${userLocation.longitude}],
              zoom: 13,
              zoomControl: true,
              attributionControl: true,
              preferCanvas: true
            });
            
            // Utiliser CartoDB Voyager (fond gris moyen élégant) - plus clair que Dark Matter
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
              subdomains: 'abcd',
              maxZoom: 19,
              className: 'custom-tile-layer'
            }).addTo(map);
            
            // Appliquer un filtre CSS pour assombrir légèrement et harmoniser avec l'app
            const mapElement = document.getElementById('map');
            if (mapElement) {
              mapElement.style.filter = 'brightness(0.75) contrast(1.15) saturate(0.85)';
            }

            // Marqueur de l'utilisateur avec style personnalisé
            const userIcon = L.divIcon({
              className: 'user-marker',
              html: '<div style="background: linear-gradient(135deg, #8B2F3F 0%, #6B1F2F 100%); width: 24px; height: 24px; border-radius: 50%; border: 4px solid #1A0A0E; box-shadow: 0 4px 16px rgba(139, 47, 63, 0.6), inset 0 2px 4px rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; animation: pulse 2s infinite;"><div style="width: 8px; height: 8px; background: white; border-radius: 50%; box-shadow: 0 0 8px rgba(255,255,255,0.8);"></div></div>',
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });
            
            L.marker([${userLocation.latitude}, ${userLocation.longitude}], {
              icon: userIcon,
              zIndexOffset: 1000
            })
            .addTo(map)
            .bindPopup(
              '<div style="background: #1A0A0E; color: white; padding: 12px; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; min-width: 150px; text-align: center;">' +
              '<b style="color: #8B2F3F; font-size: 16px;">Votre position</b>' +
              '</div>',
              { className: 'custom-popup' }
            );

            // Marqueurs des stores
            ${storesMarkers}
            
            // Gérer les clics sur les popups des stores
            map.on('popupopen', function(e) {
              const popup = e.popup;
              const popupElement = popup.getElement();
              if (popupElement) {
                popupElement.style.cursor = 'pointer';
                // Ajouter un gestionnaire de clic sur le popup
                const contentWrapper = popupElement.querySelector('.leaflet-popup-content-wrapper');
                if (contentWrapper) {
                  contentWrapper.style.cursor = 'pointer';
                  contentWrapper.addEventListener('click', function() {
                    const marker = e.popup._source;
                    if (marker && marker.options && marker.options.storeId) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'storeSelected',
                        storeId: marker.options.storeId
                      }));
                    }
                  });
                }
                // Ajouter aussi un clic sur le contenu du popup
                const content = popupElement.querySelector('.leaflet-popup-content');
                if (content) {
                  content.style.cursor = 'pointer';
                  content.addEventListener('click', function() {
                    const marker = e.popup._source;
                    if (marker && marker.options && marker.options.storeId) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'storeSelected',
                        storeId: marker.options.storeId
                      }));
                    }
                  });
                }
              }
            });

            // Animation pulse pour le marqueur utilisateur
            const style = document.createElement('style');
            style.textContent = \`
              @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.9; }
              }
            \`;
            document.head.appendChild(style);

            // Gestion des messages depuis React Native
            window.addEventListener('message', function(event) {
              try {
                const data = JSON.parse(event.data);
                if (data.type === 'recenter') {
                  map.setView([${userLocation.latitude}, ${userLocation.longitude}], 13, {
                    animate: true,
                    duration: 0.5
                  });
                }
              } catch (e) {
                console.error('Erreur parsing message:', e);
              }
            });
          </script>
        </body>
      </html>
    `;
  };

  const handleRecenter = () => {
    setMapKey(Date.now());
  };

  const handleRefresh = async () => {
    await getCurrentLocation();
    await loadStoresNearby();
  };

  return (
    <NavigationTransition>
      <View style={[styles.container, isMapFullscreen && styles.containerFullscreen]}>
        {!isMapFullscreen && (
          <LinearGradient
            colors={Colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        <SafeAreaView style={[styles.safeArea, isMapFullscreen && styles.safeAreaFullscreen]} edges={isMapFullscreen ? [] : ['top', 'left', 'right']}>
          <StatusBar barStyle="light-content" />
          
          {/* Header */}
          {!isMapFullscreen && (
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={Colors.text.light} />
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Stores près de vous</Text>
                <Text style={styles.headerSubtitle}>
                  {stores.length} store{stores.length > 1 ? 's' : ''} trouvé{stores.length > 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  onPress={() => setShowRadiusSelector(!showRadiusSelector)} 
                  style={styles.radiusButton}
                >
                  <Ionicons name="radio-button-on" size={18} color={Colors.text.light} />
                  <Text style={styles.radiusButtonText}>{radiusKm}km</Text>
                  <Ionicons 
                    name={showRadiusSelector ? "chevron-up" : "chevron-down"} 
                    size={14} 
                    color={Colors.text.light} 
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                  <Ionicons name="refresh" size={24} color={Colors.text.light} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Sélecteur de rayon */}
          {!isMapFullscreen && showRadiusSelector && (
            <View style={styles.radiusSelector}>
              {[50, 100, 200, 300, 500, 1000].map((radius) => (
                <TouchableOpacity
                  key={radius}
                  style={[
                    styles.radiusOption,
                    radiusKm === radius && styles.radiusOptionActive,
                  ]}
                  onPress={() => {
                    setRadiusKm(radius);
                    setShowRadiusSelector(false);
                  }}
                >
                  <Text
                    style={[
                      styles.radiusOptionText,
                      radiusKm === radius && styles.radiusOptionTextActive,
                    ]}
                  >
                    {radius} km
                  </Text>
                  {radiusKm === radius && (
                    <Ionicons name="checkmark" size={18} color={Colors.text.light} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B2F3F" />
              <Text style={styles.loadingText}>Chargement des stores...</Text>
            </View>
          ) : (
            <>
              {/* Map */}
              <View 
                style={[
                  styles.mapContainer, 
                  isMapFullscreen && styles.mapContainerFullscreen
                ]}
                pointerEvents={isMapFullscreen ? 'auto' : 'auto'}
              >
                {userLocation && (
                  <WebView
                    key={`map-${mapKey}-${stores.length}-${isMapFullscreen}`}
                    source={{ html: generateMapHTML() }}
                    style={[
                      styles.map, 
                      isMapFullscreen && styles.mapFullscreen,
                      isMapFullscreen && { width: '100%', height: '100%' }
                    ]}
                    cacheEnabled={false}
                    incognito={true}
                    onMessage={(event) => {
                      try {
                        const data = JSON.parse(event.nativeEvent.data);
                        if (data.type === 'storeSelected') {
                          const store = stores.find((s) => s.id === data.storeId);
                          if (store) {
                            // Si le store est déjà sélectionné, rediriger vers les détails
                            if (selectedStore?.id === store.id) {
                              setShowStoreModal(false);
                              const partner = mapStoreToPartner(store as any, 0);
                              router.push(`/(tabs)/partners?partnerId=${partner.id}`);
                            } else {
                              // Sinon, sélectionner le store et ouvrir la modal
                              setSelectedStore(store);
                              setShowStoreModal(true);
                            }
                          }
                        }
                      } catch (error) {
                        console.error('Erreur parsing message:', error);
                      }
                    }}
                    onError={(syntheticEvent) => {
                      const { nativeEvent } = syntheticEvent;
                      console.warn('WebView error: ', nativeEvent);
                    }}
                    onLoadEnd={() => {
                      console.log('🗺️ Carte chargée avec fond noir personnalisé');
                    }}
                  />
                )}
                
                {/* Bouton recenter */}
                <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter}>
                  <Ionicons name="locate" size={24} color={Colors.text.light} />
                </TouchableOpacity>
                
                {/* Bouton agrandir/réduire la carte */}
                <TouchableOpacity 
                  style={styles.fullscreenButton} 
                  onPress={() => setIsMapFullscreen(!isMapFullscreen)}
                >
                  <Ionicons 
                    name={isMapFullscreen ? "contract" : "expand"} 
                    size={24} 
                    color={Colors.text.light} 
                  />
                </TouchableOpacity>
              </View>

              {/* Liste des stores */}
              {!isMapFullscreen && (
                <ScrollView 
                  style={styles.storesList} 
                  contentContainerStyle={{
                    ...styles.storesListContent,
                    paddingBottom: insets.bottom + responsiveSpacing(Spacing.xl)
                  }}
                  showsVerticalScrollIndicator={true}
                  bounces={true}
                >
                {stores.map((store) => (
                  <NeoCard
                    key={store.id}
                    variant="glass"
                    style={StyleSheet.flatten([
                      styles.storeCard,
                      selectedStore?.id === store.id && styles.storeCardSelected,
                    ])}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        // Si le store est déjà sélectionné, rediriger vers les détails
                        if (selectedStore?.id === store.id) {
                          setShowStoreModal(false);
                          const partner = mapStoreToPartner(store as any, 0);
                          router.push(`/(tabs)/partners?partnerId=${partner.id}`);
                        } else {
                          setSelectedStore(store);
                          setShowStoreModal(true);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.storeCardContent}>
                        <View style={styles.storeIcon}>
                          <Ionicons name="storefront" size={24} color={Colors.accent.rose} />
                        </View>
                        <View style={styles.storeInfo}>
                          <Text style={styles.storeName}>
                            {store.name || store.partner?.name || 'Store'}
                          </Text>
                          {store.address?.street && (
                            <Text style={styles.storeAddress}>
                              <Ionicons name="location" size={14} color={Colors.text.muted} />
                              {' '}
                              {store.address.street}
                              {store.address.city && `, ${store.address.city}`}
                            </Text>
                          )}
                          {store.category && (
                            <View style={styles.storeCategory}>
                              <Text style={styles.storeCategoryText}>{store.category}</Text>
                            </View>
                          )}
                        </View>
                        {store.distance && (
                          <View style={styles.storeDistance}>
                            <Text style={styles.storeDistanceText}>
                              {Math.round(store.distance)} km
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  </NeoCard>
                ))}
              </ScrollView>
              )}
              </>
          )}

          {/* Modal de détails du store */}
          <Modal
            visible={showStoreModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowStoreModal(false)}
          >
            {selectedStore && (() => {
              const partner = mapStoreToPartner(selectedStore as any, 0);
              return (
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
                              const image = getRestaurantImage(partner.id, partner.name, partner.category, 800, 400);
                              return typeof image === 'number' ? image : { uri: image };
                            })()}
                            style={styles.modalImageContent}
                            resizeMode="cover"
                          />
                          {partner.promotion?.isActive && (
                            <LinearGradient
                              colors={[Colors.status.success, '#059669']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={styles.modalImagePromoBadge}
                            >
                              <Ionicons name="pricetag" size={11} color={Colors.text.light} />
                              <Text style={styles.modalImagePromoText}>
                                {partner.promotion.discount}
                              </Text>
                            </LinearGradient>
                          )}
                        </View>

                        {/* Info principale */}
                        <View style={styles.modalHeroInfo}>
                          <Text style={styles.modalName} numberOfLines={2}>
                            {partner.name}
                          </Text>
                          
                          <View style={styles.modalBadgesRow}>
                            {partner.rating > 0 && (
                              <LinearGradient
                                colors={['rgba(251, 191, 36, 0.2)', 'rgba(251, 191, 36, 0.1)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.modalRatingBadge}
                              >
                                <Ionicons name="star" size={12} color={Colors.accent.gold} />
                                <Text style={styles.modalRatingText}>
                                  {partner.rating.toFixed(1)}
                                </Text>
                              </LinearGradient>
                            )}

                            {partner.category && (
                              <View style={styles.modalCategoryBadge}>
                                <Ionicons name="pricetag-outline" size={11} color={Colors.text.light} />
                                <Text style={styles.modalCategoryText}>
                                  {partner.category}
                                </Text>
                              </View>
                            )}

                            <View style={[
                              styles.modalQuickStatusBadge,
                              partner.isOpen ? styles.modalQuickStatusOpen : styles.modalQuickStatusClosed
                            ]}>
                              <View style={[
                                styles.modalQuickStatusDot,
                                { backgroundColor: partner.isOpen ? Colors.status.success : Colors.status.error }
                              ]} />
                              <Text style={[
                                styles.modalQuickStatusText,
                                { color: partner.isOpen ? Colors.status.success : Colors.status.error }
                              ]}>
                                {partner.isOpen ? 'Ouvert' : 'Fermé'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Bouton d'action */}
                      {selectedStore.address?.latitude && selectedStore.address?.longitude && (
                        <View style={styles.modalActionWrapper}>
                          <TouchableOpacity 
                            style={styles.modalActionButton}
                            activeOpacity={0.8}
                            onPress={() => {
                              const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedStore.address!.latitude},${selectedStore.address!.longitude}`;
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
                            {partner.address}
                          </Text>
                          {partner.distance !== null && (
                            <View style={styles.modalInfoBadge}>
                              <Ionicons name="walk" size={14} color="#8B2F3F" />
                            <Text style={styles.modalInfoBadgeText}>
                              {Math.round(partner.distance)} km
                            </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Description */}
                      <View style={styles.modalDescriptionCard}>
                        <Text style={styles.modalDescriptionTitle}>À propos</Text>
                        <Text style={styles.modalDescription}>{partner.description}</Text>
                      </View>
                    </ScrollView>
                  </SafeAreaView>
                </LinearGradient>
              );
            })()}
          </Modal>
        </SafeAreaView>
      </View>
    </NavigationTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  } as ViewStyle,
  containerFullscreen: {
    backgroundColor: '#2A1A1E',
  } as ViewStyle,
  safeArea: {
    flex: 1,
    position: 'relative',
  } as ViewStyle,
  safeAreaFullscreen: {
    flex: 1,
    backgroundColor: '#2A1A1E',
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  } as ViewStyle,
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  headerContent: {
    flex: 1,
  } as ViewStyle,
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.light,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  } as ViewStyle,
  radiusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  } as ViewStyle,
  radiusButtonText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.light,
    fontWeight: Typography.weights.semibold as any,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  radiusSelector: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  radiusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  } as ViewStyle,
  radiusOptionActive: {
    backgroundColor: 'rgba(139, 47, 63, 0.3)',
  } as ViewStyle,
  radiusOptionText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium as any,
  },
  radiusOptionTextActive: {
    color: Colors.text.light,
    fontWeight: Typography.weights.bold as any,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  } as ViewStyle,
  loadingText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  } as ViewStyle,
  mapContainer: {
    flex: 1,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    // Effet 3D avec ombres multiples
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    // Bordure avec gradient pour effet de profondeur
    borderWidth: 2,
    borderColor: 'rgba(139, 47, 63, 0.4)',
  } as ViewStyle,
  mapContainerFullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    borderRadius: 0,
    marginHorizontal: 0,
    marginBottom: 0,
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
    backgroundColor: '#2A1A1E',
    width: '100%',
    height: '100%',
  } as ViewStyle,
  map: {
    flex: 1,
    backgroundColor: '#2A1A1E',
    // Effet de profondeur supplémentaire
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  mapFullscreen: {
    borderTopWidth: 0,
  } as ViewStyle,
  recenterButton: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.rose,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
    zIndex: 10,
  } as ViewStyle,
  fullscreenButton: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md + 56, // À côté du bouton recenter
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.rose,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
    zIndex: 10,
  } as ViewStyle,
  storesList: {
    maxHeight: 300,
    flexGrow: 0,
  } as ViewStyle,
  storesListContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  } as ViewStyle,
  storeCard: {
    marginBottom: 0,
  } as ViewStyle,
  storeCardSelected: {
    borderColor: Colors.accent.rose,
    borderWidth: 2,
  } as ViewStyle,
  storeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  } as ViewStyle,
  storeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(233, 30, 99, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  storeInfo: {
    flex: 1,
    gap: 4,
  } as ViewStyle,
  storeName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.light,
  },
  storeAddress: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.muted,
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeCategory: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  } as ViewStyle,
  storeCategoryText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium as any,
  },
  storeDistance: {
    alignItems: 'flex-end',
  } as ViewStyle,
  storeDistanceText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.accent.rose,
  },
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
});




