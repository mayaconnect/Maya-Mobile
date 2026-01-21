import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { StoresMapApi } from '../services/storesMapApi';
import { Store, StoreSearchParams } from '../types';

export const useStoresMap = () => {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });

  const getCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission de localisation refusée');
      }

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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération de la position';
      setError(errorMessage);
      console.error('Erreur useStoresMap getCurrentLocation:', err);
      throw err;
    }
  }, []);

  const searchStores = useCallback(async (params?: StoreSearchParams) => {
    setLoading(true);
    setError(null);
    try {
      const searchParams: StoreSearchParams = {
        ...params,
        latitude: params?.latitude || userLocation?.latitude,
        longitude: params?.longitude || userLocation?.longitude,
      };

      const results = await StoresMapApi.searchStores(searchParams);
      setStores(results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la recherche de stores';
      setError(errorMessage);
      console.error('Erreur useStoresMap searchStores:', err);
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

  useEffect(() => {
    getCurrentLocation().then(() => {
      searchStores();
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  return {
    userLocation,
    stores,
    loading,
    error,
    mapRegion,
    setMapRegion,
    getCurrentLocation,
    searchStores,
    refetch: searchStores,
  };
};

