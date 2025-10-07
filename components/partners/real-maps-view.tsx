import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Partner } from './partner-card';

interface RealMapsViewProps {
  partners: Partner[];
  onPartnerSelect: (partner: Partner) => void;
  style?: any;
}

const { width, height } = Dimensions.get('window');

// Coordonnées GPS réelles de Paris pour les partenaires
const PARIS_COORDINATES = [
  { latitude: 48.8566, longitude: 2.3522, name: 'Café des Arts', address: '15 rue de la Paix, Paris' },
  { latitude: 48.8606, longitude: 2.3376, name: 'Bistro Le Marché', address: '8 place du Marché, Paris' },
  { latitude: 48.8584, longitude: 2.2945, name: 'Boulangerie Martin', address: '12 avenue des Champs, Paris' },
  { latitude: 48.8566, longitude: 2.3522, name: 'Restaurant Sushi Zen', address: '25 rue de Rivoli, Paris' },
  { latitude: 48.8534, longitude: 2.3488, name: 'Coffee Shop Corner', address: '7 boulevard Saint-Germain, Paris' },
];

export function RealMapsView({ partners, onPartnerSelect, style }: RealMapsViewProps) {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        getCurrentLocation();
      }
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de la position:', error);
    }
  };

  const openGoogleMaps = async (partner?: Partner, index?: number) => {
    try {
      let url: string;
      
      if (partner && index !== undefined) {
        const coordinate = PARIS_COORDINATES[index];
        if (!coordinate) return;
        
        // Ouvrir Google Maps avec le partenaire spécifique
        url = `https://www.google.com/maps/search/?api=1&query=${coordinate.latitude},${coordinate.longitude}&query_place_id=${coordinate.name}`;
      } else if (userLocation) {
        // Ouvrir Google Maps centré sur la position utilisateur
        url = `https://www.google.com/maps/@${userLocation.latitude},${userLocation.longitude},15z`;
      } else {
        // Ouvrir Google Maps avec Paris par défaut
        url = `https://www.google.com/maps/@48.8566,2.3522,13z`;
      }

      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        controlsColor: Colors.primary[600],
        toolbarColor: Colors.primary[600],
      });
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de Google Maps:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir Google Maps');
    }
  };

  const openAppleMaps = (partner?: Partner, index?: number) => {
    try {
      let url: string;
      
      if (partner && index !== undefined) {
        const coordinate = PARIS_COORDINATES[index];
        if (!coordinate) return;
        
        url = `https://maps.apple.com/?q=${coordinate.latitude},${coordinate.longitude}&t=m`;
      } else if (userLocation) {
        url = `https://maps.apple.com/?q=${userLocation.latitude},${userLocation.longitude}&t=m`;
      } else {
        url = `https://maps.apple.com/?q=48.8566,2.3522&t=m`;
      }

      Linking.openURL(url);
    } catch (error) {
      console.error('Erreur lors de l\'ouverture d\'Apple Maps:', error);
    }
  };

  const getDistanceFromUser = (partnerIndex: number) => {
    if (!userLocation) return null;
    
    const coordinate = PARIS_COORDINATES[partnerIndex];
    if (!coordinate) return null;

    // Calcul simple de distance (approximatif)
    const R = 6371; // Rayon de la Terre en km
    const dLat = (coordinate.latitude - userLocation.latitude) * Math.PI / 180;
    const dLon = (coordinate.longitude - userLocation.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(coordinate.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance.toFixed(1);
  };

  const toggleMapType = () => {
    const types: Array<'roadmap' | 'satellite' | 'hybrid'> = ['roadmap', 'satellite', 'hybrid'];
    const currentIndex = types.indexOf(mapType);
    const nextIndex = (currentIndex + 1) % types.length;
    setMapType(types[nextIndex]);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Zone de carte principale */}
      <View style={styles.mapContainer}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>🗺️ Carte Interactive</Text>
          <Text style={styles.mapSubtitle}>
            {partners.length} partenaires • {userLocation ? '📍 Position détectée' : '❌ Position non disponible'}
          </Text>
        </View>
        
        {/* Carte principale avec marqueurs */}
        <View style={styles.mainMap}>
          {partners.map((partner, index) => {
            const coordinate = PARIS_COORDINATES[index];
            if (!coordinate) return null;
            
            // Position relative sur la carte principale
            const x = ((coordinate.longitude - 2.2945) / (2.3522 - 2.2945)) * 100;
            const y = ((48.8606 - coordinate.latitude) / (48.8606 - 48.8534)) * 100;
            
            return (
              <TouchableOpacity
                key={partner.id}
                style={[
                  styles.mapMarker,
                  {
                    left: `${Math.max(5, Math.min(95, x))}%`,
                    top: `${Math.max(5, Math.min(95, y))}%`,
                  }
                ]}
                onPress={() => onPartnerSelect(partner)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.markerPin,
                  partner.isOpen ? styles.markerOpen : styles.markerClosed
                ]}>
                  <Ionicons 
                    name="location" 
                    size={16} 
                    color={Colors.text.light} 
                  />
                </View>
                <View style={styles.markerLabel}>
                  <Text style={styles.markerText}>{partner.name}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          
          {/* Marqueur utilisateur */}
          {userLocation && (
            <View style={[styles.userMarker, { left: '50%', top: '50%' }]}>
              <View style={styles.userMarkerPin}>
                <Ionicons name="person" size={16} color={Colors.text.light} />
              </View>
              <Text style={styles.userMarkerLabel}>Vous</Text>
            </View>
          )}
        </View>

        {/* Boutons d'action rapide */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => openGoogleMaps()}
          >
            <Ionicons name="logo-google" size={20} color={Colors.text.light} />
            <Text style={styles.quickActionText}>Google Maps</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => openAppleMaps()}
          >
            <Ionicons name="map" size={20} color={Colors.text.light} />
            <Text style={styles.quickActionText}>Apple Maps</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Liste des partenaires compacte */}
      <ScrollView style={styles.partnersList} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>📍 Partenaires à proximité</Text>
        
        {partners.map((partner, index) => {
          const coordinate = PARIS_COORDINATES[index];
          const distanceFromUser = getDistanceFromUser(index);
          
          return (
            <TouchableOpacity
              key={partner.id}
              style={styles.partnerItem}
              onPress={() => onPartnerSelect(partner)}
              activeOpacity={0.7}
            >
              <View style={styles.partnerItemLeft}>
                <View style={[
                  styles.partnerStatusDot,
                  partner.isOpen ? styles.statusOpen : styles.statusClosed
                ]} />
                <View style={styles.partnerInfo}>
                  <Text style={styles.partnerName}>{partner.name}</Text>
                  <Text style={styles.partnerDistance}>
                    {distanceFromUser ? `${distanceFromUser} km` : `${partner.distance} km`} • ⭐ {partner.rating}
                  </Text>
                  <Text style={[
                    styles.partnerStatus,
                    partner.isOpen ? styles.statusOpenText : styles.statusClosedText
                  ]}>
                    {partner.isOpen ? `Ouvert • ${partner.closingTime}` : 'Fermé'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.partnerActions}>
                <TouchableOpacity 
                  style={styles.navigateButton}
                  onPress={() => openGoogleMaps(partner, index)}
                >
                  <Ionicons name="navigate" size={16} color={Colors.primary[600]} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.mapButton}
                  onPress={() => openAppleMaps(partner, index)}
                >
                  <Ionicons name="map" size={16} color={Colors.primary[600]} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Contrôles flottants */}
      <View style={styles.floatingControls}>
        <TouchableOpacity style={styles.floatingButton} onPress={getCurrentLocation}>
          <Ionicons name="locate" size={24} color={Colors.text.light} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.floatingButton} onPress={toggleMapType}>
          <Ionicons name="layers" size={24} color={Colors.text.light} />
        </TouchableOpacity>
      </View>

      {/* Légende */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendMarker, styles.markerOpen]} />
          <Text style={styles.legendText}>Ouvert</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendMarker, styles.markerClosed]} />
          <Text style={styles.legendText}>Fermé</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendMarker, styles.userMarker]} />
          <Text style={styles.legendText}>Vous</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.light,
  } as ViewStyle,
  mapContainer: {
    height: height * 0.5, // 50% de la hauteur de l'écran
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.lg,
    margin: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
  } as ViewStyle,
  mapHeader: {
    padding: Spacing.md,
    backgroundColor: Colors.background.card,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  } as ViewStyle,
  mapTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
  } as TextStyle,
  mapSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  } as TextStyle,
  mainMap: {
    flex: 1,
    backgroundColor: Colors.primary[100],
    position: 'relative',
    margin: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary[200],
  } as ViewStyle,
  mapMarker: {
    position: 'absolute',
    alignItems: 'center',
  } as ViewStyle,
  markerPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  } as ViewStyle,
  markerLabel: {
    backgroundColor: Colors.background.card,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  } as ViewStyle,
  markerText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    color: Colors.text.primary,
  } as TextStyle,
  markerOpen: {
    backgroundColor: Colors.status.success,
  } as ViewStyle,
  markerClosed: {
    backgroundColor: Colors.status.error,
  } as ViewStyle,
  userMarker: {
    position: 'absolute',
    alignItems: 'center',
  } as ViewStyle,
  userMarkerPin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  } as ViewStyle,
  quickActions: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
  } as ViewStyle,
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[600],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  } as ViewStyle,
  quickActionText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.light,
  } as TextStyle,
  partnersList: {
    backgroundColor: Colors.background.card,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    maxHeight: height * 0.3, // Réduit à 30% de la hauteur
  } as ViewStyle,
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  } as TextStyle,
  partnerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary[100],
  } as ViewStyle,
  partnerItemLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: Spacing.md,
  } as ViewStyle,
  partnerStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
    marginTop: Spacing.xs,
  } as ViewStyle,
  statusOpen: {
    backgroundColor: Colors.status.success,
  } as ViewStyle,
  statusClosed: {
    backgroundColor: Colors.status.error,
  } as ViewStyle,
  partnerInfo: {
    flex: 1,
  } as ViewStyle,
  partnerName: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  } as TextStyle,
  partnerDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  } as TextStyle,
  partnerAddress: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  } as TextStyle,
  partnerMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  } as ViewStyle,
  partnerRating: {
    fontSize: Typography.sizes.xs,
    color: Colors.accent.gold,
    fontWeight: '600',
  } as TextStyle,
  partnerDistance: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: '600',
  } as TextStyle,
  partnerStatus: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
  } as TextStyle,
  statusOpenText: {
    color: Colors.status.success,
  } as TextStyle,
  statusClosedText: {
    color: Colors.status.error,
  } as TextStyle,
  partnerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  } as ViewStyle,
  navigateButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.primary[100],
    borderRadius: BorderRadius.md,
  } as ViewStyle,
  mapButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.primary[100],
    borderRadius: BorderRadius.md,
  } as ViewStyle,
  floatingControls: {
    position: 'absolute',
    right: Spacing.md,
    top: Spacing.xl,
    gap: Spacing.sm,
  } as ViewStyle,
  floatingButton: {
    backgroundColor: Colors.primary[600],
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  } as ViewStyle,
  legend: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.background.card,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  } as ViewStyle,
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  } as ViewStyle,
  legendMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
  } as ViewStyle,
  legendText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '500',
  } as TextStyle,
});
