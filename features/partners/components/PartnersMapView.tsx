import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { responsiveSpacing } from '@/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  // ⚠️ IMPORTANT: Les hooks doivent être appelés AVANT tous les returns conditionnels
  const [mapKey, setMapKey] = React.useState(Date.now());
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get('window').height;
  
  // Calculer la hauteur de la carte pour qu'elle s'arrête avant la barre de navigation
  // Barre de navigation: ~75px + safe area bottom
  const navBarHeight = responsiveSpacing(75) + insets.bottom;
  const mapHeight = screenHeight - navBarHeight - responsiveSpacing(350); // Réserver de l'espace pour le header et autres éléments

  React.useEffect(() => {
    // Forcer le rechargement de la carte quand la position ou les stores changent
    setMapKey(Date.now());
  }, [userLocation, mapStores.length]);

  const handleWebViewMessage = useCallback((event: any) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'storeClick' && data.storeId) {
      onStoreClick(data.storeId);
    }
  }, [onStoreClick]);

  const webViewRef = React.useRef<any>(null);

  const handleZoomIn = useCallback(() => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.map) {
          window.map.zoomIn();
        }
        true;
      `);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.map) {
          window.map.zoomOut();
        }
        true;
      `);
    }
  }, []);

  if (mapLoading) {
    return (
      <View style={styles.mapContainer}>
        <View style={styles.mapLoadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent.rose} />
          <Text style={styles.mapLoadingText}>Chargement des stores à proximité...</Text>
        </View>
      </View>
    );
  }

  if (!userLocation) {
    return (
      <View style={styles.mapContainer}>
        <View style={styles.mapLoadingContainer}>
          <Ionicons name="location-outline" size={responsiveSpacing(48)} color={Colors.accent.rose} />
          <Text style={styles.mapLoadingText}>Activation de la géolocalisation...</Text>
          <TouchableOpacity style={styles.locationButton} onPress={onRequestLocationPermission}>
            <Text style={styles.locationButtonText}>Autoriser la géolocalisation</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mapWrapper}>
      {/* Bordure supérieure pour effet 3D */}
      <View style={styles.mapTopBorder} />
      <View style={[styles.mapContainer, { height: mapHeight }]}>
        <WebView
          ref={webViewRef}
          key={`partners-map-${mapKey}-${mapStores.length}`}
          style={styles.map}
          source={{
            html: generateMapHTML(userLocation, mapStores),
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          cacheEnabled={false}
          incognito={true}
          onMessage={handleWebViewMessage}
          onLoadEnd={() => {
            console.log('🗺️ Carte partenaires chargée avec fond noir personnalisé');
          }}
        />

        {/* Blur overlays sur les côtés avec la couleur de l'app */}
        <View style={styles.blurOverlayLeft} pointerEvents="none">
          <LinearGradient
            colors={['rgba(139, 47, 63, 0.35)', 'rgba(139, 47, 63, 0.15)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientFill}
          />
        </View>
        <View style={styles.blurOverlayRight} pointerEvents="none">
          <LinearGradient
            colors={['transparent', 'rgba(139, 47, 63, 0.15)', 'rgba(139, 47, 63, 0.35)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientFill}
          />
        </View>
      </View>
      {/* Bordure inférieure pour effet 3D */}
      <View style={styles.mapBottomBorder} />

      {/* Contrôles de zoom à gauche */}
      <View style={styles.zoomControls}>
        <TouchableOpacity 
          style={styles.zoomButton} 
          activeOpacity={0.7}
          onPress={handleZoomIn}
        >
          <Ionicons name="add" size={responsiveSpacing(20)} color={Colors.accent.rose} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.zoomButton} 
          activeOpacity={0.7}
          onPress={handleZoomOut}
        >
          <Ionicons name="remove" size={responsiveSpacing(20)} color={Colors.accent.rose} />
        </TouchableOpacity>
      </View>

      {/* Contrôles de la carte à droite */}
      <View style={styles.mapControls}>
        <TouchableOpacity 
          style={styles.mapControlButton} 
          activeOpacity={0.7}
        >
          <Ionicons name="expand" size={responsiveSpacing(20)} color={Colors.accent.rose} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.mapControlButton} 
          onPress={onGetCurrentLocation}
          activeOpacity={0.7}
        >
          <Ionicons name="locate" size={responsiveSpacing(20)} color={Colors.accent.rose} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.mapControlButton} 
          onPress={onLoadStoresNearby}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={responsiveSpacing(20)} color={Colors.accent.rose} />
        </TouchableOpacity>
      </View>

     
    </View>
  );
};

const styles = StyleSheet.create({
  mapWrapper: {
    width: '100%',
    marginTop: responsiveSpacing(Spacing.md),
    marginBottom: responsiveSpacing(Spacing.xl),
    position: 'relative',
  } as ViewStyle,
  mapTopBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: responsiveSpacing(3),
    backgroundColor: 'rgba(139, 47, 63, 0.6)',
    zIndex: 10,
    borderTopLeftRadius: responsiveSpacing(2),
    borderTopRightRadius: responsiveSpacing(2),
  } as ViewStyle,
  mapBottomBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: responsiveSpacing(3),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
    borderBottomLeftRadius: responsiveSpacing(2),
    borderBottomRightRadius: responsiveSpacing(2),
  } as ViewStyle,
  mapContainer: {
    width: '100%',
    borderRadius: 0, // Pas de border radius pour prendre toute la largeur
    overflow: 'hidden',
    backgroundColor: Colors.background.dark,
    // Effet 3D avec ombres multiples et contours
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    // Bordures pour effet de profondeur
    borderLeftWidth: responsiveSpacing(2),
    borderRightWidth: responsiveSpacing(2),
    borderTopWidth: responsiveSpacing(2),
    borderBottomWidth: responsiveSpacing(2),
    borderColor: 'rgba(139, 47, 63, 0.5)',
    // Hauteur calculée dynamiquement pour s'arrêter avant la barre de navigation
  } as ViewStyle,
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: Colors.background.dark,
    // Effet de profondeur supplémentaire
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  blurOverlayLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: responsiveSpacing(60),
    zIndex: 5,
  } as ViewStyle,
  blurOverlayRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: responsiveSpacing(60),
    zIndex: 5,
  } as ViewStyle,
  gradientFill: {
    flex: 1,
    width: '100%',
    height: '100%',
  } as ViewStyle,
  mapLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsiveSpacing(Spacing.xl),
    gap: responsiveSpacing(Spacing.md),
    minHeight: responsiveSpacing(400),
    backgroundColor: Colors.background.dark,
  } as ViewStyle,
  mapLoadingText: {
    fontSize: responsiveSpacing(Typography.sizes.base),
    color: Colors.text.secondary,
    textAlign: 'center',
    fontWeight: Typography.weights.medium as any,
  } as TextStyle,
  locationButton: {
    backgroundColor: Colors.accent.rose,
    paddingHorizontal: responsiveSpacing(Spacing.xl),
    paddingVertical: responsiveSpacing(Spacing.md),
    borderRadius: BorderRadius.lg,
    marginTop: responsiveSpacing(Spacing.md),
    shadowColor: Colors.accent.rose,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  } as ViewStyle,
  locationButtonText: {
    color: 'white',
    fontSize: responsiveSpacing(Typography.sizes.base),
    fontWeight: Typography.weights.semibold as any,
  } as TextStyle,
  zoomControls: {
    position: 'absolute',
    left: responsiveSpacing(Spacing.md),
    top: responsiveSpacing(Spacing.md),
    gap: responsiveSpacing(Spacing.xs),
    zIndex: 1000,
  } as ViewStyle,
  zoomButton: {
    backgroundColor: 'rgba(26, 10, 14, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(139, 47, 63, 0.3)',
    width: responsiveSpacing(44),
    height: responsiveSpacing(44),
    borderRadius: responsiveSpacing(22),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  } as ViewStyle,
  mapControls: {
    position: 'absolute',
    right: responsiveSpacing(Spacing.md),
    top: responsiveSpacing(Spacing.md),
    gap: responsiveSpacing(Spacing.sm),
    zIndex: 1000,
  } as ViewStyle,
  mapControlButton: {
    backgroundColor: 'rgba(26, 10, 14, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(139, 47, 63, 0.3)',
    width: responsiveSpacing(44),
    height: responsiveSpacing(44),
    borderRadius: responsiveSpacing(22),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  } as ViewStyle,
  mapInfo: {
    position: 'relative',
    bottom: responsiveSpacing(50),
    zIndex: 1000,
    backgroundColor: 'rgba(139, 47, 63, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(139, 47, 63, 0.5)',
    padding: responsiveSpacing(Spacing.md),
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSpacing(Spacing.sm),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  } as ViewStyle,
  mapInfoText: {
    fontSize: responsiveSpacing(Typography.sizes.sm),
    color: Colors.text.light,
    fontWeight: Typography.weights.semibold as any,
    flex: 1,
  } as TextStyle,
});
