import { NavigationTransition } from '@/components/common/navigation-transition';
import { NeoCard } from '@/components/neo/NeoCard';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { StoresApi } from '@/features/stores-map/services/storesApi';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (userLocation) {
      loadStoresNearby();
    }
  }, [userLocation]);

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
        radiusKm: 50,
      });

      const response = await StoresApi.searchStores({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radiusKm: 50,
        pageSize: 100,
      });

      console.log('✅ [Stores Map] Stores récupérés:', response.items.length);
      setStores(response.items || []);
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
        const name = store.name || store.partner?.name || 'Store';
        return `
          L.marker([${lat}, ${lng}])
            .addTo(map)
            .bindPopup('<b>${name}</b><br/>${store.address?.street || ''}')
            .on('click', function() {
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
            body { margin: 0; padding: 0; }
            #map { width: 100%; height: 100vh; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            const map = L.map('map').setView([${userLocation.latitude}, ${userLocation.longitude}], 13);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors',
              maxZoom: 19
            }).addTo(map);

            // Marqueur de l'utilisateur
            L.marker([${userLocation.latitude}, ${userLocation.longitude}], {
              icon: L.divIcon({
                className: 'user-marker',
                html: '<div style="background-color: #8B2F3F; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })
            }).addTo(map).bindPopup('<b>Votre position</b>');

            // Marqueurs des stores
            ${storesMarkers}

            window.addEventListener('message', function(event) {
              const data = JSON.parse(event.data);
              if (data.type === 'recenter') {
                map.setView([${userLocation.latitude}, ${userLocation.longitude}], 13);
              }
            });
          </script>
        </body>
      </html>
    `;
  };

  const handleRecenter = () => {
    setMapKey((prev) => prev + 1);
  };

  const handleRefresh = async () => {
    await getCurrentLocation();
    await loadStoresNearby();
  };

  return (
    <NavigationTransition>
      <View style={styles.container}>
        <LinearGradient
          colors={Colors.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <StatusBar barStyle="light-content" />
          
          {/* Header */}
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
            <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
              <Ionicons name="refresh" size={24} color={Colors.text.light} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B2F3F" />
              <Text style={styles.loadingText}>Chargement des stores...</Text>
            </View>
          ) : (
            <>
              {/* Map */}
              <View style={styles.mapContainer}>
                {userLocation && (
                  <WebView
                    key={mapKey}
                    source={{ html: generateMapHTML() }}
                    style={styles.map}
                    onMessage={(event) => {
                      try {
                        const data = JSON.parse(event.nativeEvent.data);
                        if (data.type === 'storeSelected') {
                          const store = stores.find((s) => s.id === data.storeId);
                          if (store) {
                            setSelectedStore(store);
                          }
                        }
                      } catch (error) {
                        console.error('Erreur parsing message:', error);
                      }
                    }}
                  />
                )}
                
                {/* Bouton recenter */}
                <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter}>
                  <Ionicons name="locate" size={24} color={Colors.text.light} />
                </TouchableOpacity>
              </View>

              {/* Liste des stores */}
              <ScrollView style={styles.storesList} contentContainerStyle={styles.storesListContent}>
                {stores.map((store) => (
                  <NeoCard
                    key={store.id}
                    variant="glass"
                    style={[
                      styles.storeCard,
                      selectedStore?.id === store.id && styles.storeCardSelected,
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => setSelectedStore(store)}
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
                              {store.distance.toFixed(1)} km
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  </NeoCard>
                ))}
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </View>
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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
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
  mapContainer: {
    flex: 1,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    ...Shadows.lg,
  } as ViewStyle,
  map: {
    flex: 1,
    backgroundColor: '#1A0A0E',
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
  } as ViewStyle,
  storesList: {
    maxHeight: 300,
  } as ViewStyle,
  storesListContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
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
});




