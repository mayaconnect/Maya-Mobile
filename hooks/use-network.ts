/**
 * Hook pour surveiller le statut réseau
 * Utilise l'API fetch pour détecter la connectivité
 */

import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from '@/contexts/app-context';
import { log } from '@/utils/logger';
import { API_CONFIG } from '@/config/api.config';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

/**
 * Hook pour surveiller le statut réseau de l'appareil
 * Utilise une requête HEAD vers l'API pour vérifier la connectivité
 */
export function useNetwork(): NetworkState & {
  refetch: () => Promise<void>;
} {
  const [state, setState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: null,
    type: null,
  });
  const { setNetworkStatus } = useNetworkStatus();

  const checkNetwork = useCallback(async () => {
    try {
      // Essayer une requête HEAD vers l'API pour vérifier la connectivité
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(API_CONFIG.BASE_URL, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);

      const newState: NetworkState = {
        isConnected: response.ok || response.status < 500,
        isInternetReachable: response.ok,
        type: 'unknown',
      };

      setState(newState);
      setNetworkStatus(newState.isConnected ? 'online' : 'offline');

      if (!newState.isConnected) {
        log.warn('Connexion réseau perdue', newState);
      } else {
        log.info('Connexion réseau active', newState);
      }
    } catch (error) {
      const newState: NetworkState = {
        isConnected: false,
        isInternetReachable: false,
        type: null,
      };

      setState(newState);
      setNetworkStatus('offline');
      log.warn('Connexion réseau perdue', { error });
    }
  }, [setNetworkStatus]);

  const refetch = useCallback(async () => {
    await checkNetwork();
  }, [checkNetwork]);

  useEffect(() => {
    // Vérifier immédiatement
    checkNetwork();

    // Vérifier périodiquement (toutes les 30 secondes)
    const interval = setInterval(checkNetwork, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [checkNetwork]);

  return {
    ...state,
    refetch,
  };
}

