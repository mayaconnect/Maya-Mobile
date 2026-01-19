import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { Partner } from '../types';
import { StoresApi } from '@/features/stores-map/services/storesApi';

export const usePartnerMap = () => {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [mapPartners, setMapPartners] = useState<Partner[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 48.8566, // Paris par défaut
    longitude: 2.3522,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });

  const getCurrentLocation = useCallback(async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setUserLocation(coords);
      setMapRegion({
        ...coords,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      });
      return coords;
    } catch (error) {
      console.error('Erreur lors de la récupération de la position:', error);
      throw error;
    }
  }, []);

  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setLocationPermission(granted);
      if (granted) {
        await getCurrentLocation();
      }
      return granted;
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
      setLocationPermission(false);
      return false;
    }
  }, [getCurrentLocation]);

  const loadPartnersNearby = useCallback(async (mapStore: (dto: any, index: number) => Partner) => {
    setMapLoading(true);
    try {
      let currentPermission = locationPermission;
      if (!currentPermission) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        currentPermission = status === 'granted';
        setLocationPermission(currentPermission);
        
        if (!currentPermission) {
          setMapLoading(false);
          return;
        }
      }

      let currentLocation = userLocation;
      if (!currentLocation) {
        currentLocation = await getCurrentLocation();
      }

      if (!currentLocation) {
        currentLocation = { latitude: 48.8566, longitude: 2.3522 };
      }

      const response = await StoresApi.searchStores({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        radiusKm: 50,
        page: 1,
        pageSize: 100,
      });
      
      const mapped = response.items.map((store, index) => mapStore(store, index));
      setMapPartners(mapped);
    } catch (error) {
      console.error('Erreur lors du chargement des partenaires:', error);
      throw error;
    } finally {
      setMapLoading(false);
    }
  }, [userLocation, locationPermission, getCurrentLocation]);

  return {
    userLocation,
    locationPermission,
    mapPartners,
    mapLoading,
    mapRegion,
    setMapRegion,
    getCurrentLocation,
    requestLocationPermission,
    loadPartnersNearby,
  };
};

