/**
 * Contexte global de l'application
 * Gère l'état global partagé entre les composants
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { log } from '@/utils/logger';

interface AppState {
  isLoading: boolean;
  error: string | null;
  networkStatus: 'online' | 'offline';
}

interface AppContextValue {
  state: AppState;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setNetworkStatus: (status: 'online' | 'offline') => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, setState] = useState<AppState>({
    isLoading: false,
    error: null,
    networkStatus: 'online',
  });

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
    if (loading) {
      log.debug('État de chargement activé');
    }
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
    if (error) {
      log.error('Erreur globale définie', undefined, { error });
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const setNetworkStatus = useCallback((status: 'online' | 'offline') => {
    setState((prev) => ({ ...prev, networkStatus: status }));
    log.info(`Statut réseau: ${status}`);
  }, []);

  const value: AppContextValue = {
    state,
    setLoading,
    setError,
    clearError,
    setNetworkStatus,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Hook pour accéder au contexte de l'application
 */
export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext doit être utilisé dans un AppProvider');
  }
  return context;
}

/**
 * Hook pour gérer l'état de chargement
 */
export function useLoading() {
  const { state, setLoading } = useAppContext();
  return {
    isLoading: state.isLoading,
    setLoading,
    withLoading: async <T,>(fn: () => Promise<T>): Promise<T> => {
      setLoading(true);
      try {
        return await fn();
      } finally {
        setLoading(false);
      }
    },
  };
}

/**
 * Hook pour gérer les erreurs globales
 */
export function useError() {
  const { state, setError, clearError } = useAppContext();
  return {
    error: state.error,
    setError,
    clearError,
  };
}

/**
 * Hook pour le statut réseau
 */
export function useNetworkStatus() {
  const { state, setNetworkStatus } = useAppContext();
  return {
    isOnline: state.networkStatus === 'online',
    isOffline: state.networkStatus === 'offline',
    setNetworkStatus,
  };
}

