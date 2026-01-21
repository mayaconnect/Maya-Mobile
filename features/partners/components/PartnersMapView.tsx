import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Partner } from '../types';

interface PartnersMapViewProps {
  userLocation: { latitude: number; longitude: number } | null;
  locationPermission: boolean;
  mapStores: Partner[];
  mapLoading: boolean;
  onRequestLocationPermission: () => void;
  onGetCurrentLocation: () => void;
  onLoadStoresNearby: () => void;
  onStoreClick: (storeId: string) => void;
  generateMapHTML: (userLoc: { latitude: number; longitude: number } | null, stores: Partner[]) => string;
}

export const PartnersMapView: React.FC<PartnersMapViewProps> = ({
  userLocation,
  locationPermission,
  mapStores,
  mapLoading,
  onRequestLocationPermission,
  onGetCurrentLocation,
  onLoadStoresNearby,
  onStoreClick,
  generateMapHTML,
}) => {
  const handleWebViewMessage = useCallback((event: any) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'storeClick' && data.storeId) {
      onStoreClick(data.storeId);
    }
  }, [onStoreClick]);

  if (mapLoading) {
    return (
      <View style={styles.mapContainer}>
        <View style={styles.mapLoadingContainer}>
          <ActivityIndicator size="large" color="#8B2F3F" />
          <Text style={styles.mapLoadingText}>Chargement des stores à proximité...</Text>
        </View>
      </View>
    );
  }

  if (!userLocation) {
    return (
      <View style={styles.mapContainer}>
        <View style={styles.mapLoadingContainer}>
          <Ionicons name="location-outline" size={48} color={Colors.text.secondary} />
          <Text style={styles.mapLoadingText}>Activation de la géolocalisation...</Text>
          <TouchableOpacity style={styles.locationButton} onPress={onRequestLocationPermission}>
            <Text style={styles.locationButtonText}>Autoriser la géolocalisation</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mapContainer}>
      <WebView
        style={styles.map}
        source={{
          html: generateMapHTML(userLocation, mapStores),
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleWebViewMessage}
      />

      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.mapControlButton} onPress={onGetCurrentLocation}>
          <Ionicons name="locate" size={24} color="#8B2F3F" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.mapControlButton} onPress={onLoadStoresNearby}>
          <Ionicons name="refresh" size={24} color="#8B2F3F" />
        </TouchableOpacity>
      </View>

      <View style={styles.mapInfo}>
        <Text style={styles.mapInfoText}>
          {mapStores.length} store{mapStores.length > 1 ? 's' : ''} dans un rayon de 50km
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

