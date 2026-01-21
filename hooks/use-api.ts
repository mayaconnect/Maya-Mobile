/**
 * Hook optimisé pour les appels API avec cache, memoization et gestion d'état avancée
 */

import { useError, useLoading } from '@/contexts/app-context';
import { ApiClient, ApiClientOptions } from '@/services/shared/api-client';
import { ApiError } from '@/services/shared/errors';
import { log } from '@/utils/logger';
import { offlineSync } from '@/utils/offline-sync';
import { persistentCache } from '@/utils/persistent-cache';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface UseApiOptions<T> {
  /**
   * Si true, l'appel API est effectué automatiquement au montage
   */
  immediate?: boolean;
  /**
   * Options pour l'appel API
   */
  apiOptions?: ApiClientOptions;
  /**
   * Callback appelé en cas de succès
   */
  onSuccess?: (data: T) => void;
  /**
   * Callback appelé en cas d'erreur
   */
  onError?: (error: ApiError) => void;
  /**
   * Si true, utilise le loading global au lieu du loading local
   */
  useGlobalLoading?: boolean;
  /**
   * Clé de cache pour cette requête (optionnel)
   */
  cacheKey?: string;
  /**
   * Durée de cache en millisecondes (défaut: 5 minutes)
   */
  cacheTime?: number;
  /**
   * Si true, refetch automatiquement en cas d'erreur réseau
   */
  retryOnError?: boolean;
  /**
   * Nombre de tentatives en cas d'erreur
   */
  retryCount?: number;
  /**
   * Si true, utilise le cache persistant (AsyncStorage) au lieu du cache mémoire uniquement
   */
  usePersistentCache?: boolean;
  /**
   * Si true, queue la requête en cas d'erreur réseau pour synchronisation offline
   */
  enableOfflineSync?: boolean;
}

export interface UseApiResult<T> {
  /**
   * Données retournées par l'API
   */
  data: T | null;
  /**
   * État de chargement
   */
  loading: boolean;
  /**
   * Erreur éventuelle
   */
  error: ApiError | null;
  /**
   * Réexécuter l'appel API
   */
  refetch: () => Promise<void>;
  /**
   * Réinitialiser l'état (data, error)
   */
  reset: () => void;
  /**
   * Vérifier si les données sont en cache
   */
  isCached: boolean;
}

// Cache mémoire rapide (complémentaire au cache persistant)
const apiCache = new Map<string, { data: unknown; timestamp: number; cacheTime: number }>();

/**
 * Nettoie le cache mémoire des entrées expirées
 */
function cleanCache(): void {
  const now = Date.now();
  for (const [key, value] of apiCache.entries()) {
    if (now - value.timestamp > value.cacheTime) {
      apiCache.delete(key);
    }
  }
}

// Nettoyer le cache toutes les minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanCache, 60000);
}

/**
 * Hook optimisé pour effectuer un appel API GET avec gestion d'état, cache et retry
 */
export function useApi<T>(
  endpoint: string | null,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const {
    immediate = true,
    apiOptions,
    onSuccess,
    onError,
    useGlobalLoading = false,
    cacheKey,
    cacheTime = 5 * 60 * 1000, // 5 minutes par défaut
    retryOnError = false,
    retryCount = 3,
    usePersistentCache = false,
    enableOfflineSync = false,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLocalLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [isCached, setIsCached] = useState(false);
  const { setLoading: setGlobalLoading } = useLoading();
  const { setError: setGlobalError } = useError();
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);

  // Générer une clé de cache unique
  const effectiveCacheKey = useMemo(() => {
    return cacheKey || (endpoint ? `api:${endpoint}:${JSON.stringify(apiOptions)}` : null);
  }, [cacheKey, endpoint, apiOptions]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async (skipCache = false): Promise<void> => {
    if (!endpoint) {
      return;
    }

    // Vérifier le cache (mémoire puis persistant)
    if (!skipCache && effectiveCacheKey) {
      // Cache mémoire d'abord
      const cached = apiCache.get(effectiveCacheKey);
      if (cached && Date.now() - cached.timestamp < cached.cacheTime) {
        if (mountedRef.current) {
          setData(cached.data as T);
          setIsCached(true);
          setError(null);
          if (onSuccess) {
            onSuccess(cached.data as T);
          }
          log.debug(`Données récupérées du cache mémoire: ${effectiveCacheKey}`);
        }
        return;
      }

      // Si pas en mémoire et cache persistant activé, vérifier AsyncStorage
      if (usePersistentCache) {
        const persistentCached = await persistentCache.get<T>(effectiveCacheKey);
        if (persistentCached) {
          if (mountedRef.current) {
            setData(persistentCached);
            setIsCached(true);
            setError(null);
            // Remettre en cache mémoire pour les prochaines requêtes
            apiCache.set(effectiveCacheKey, {
              data: persistentCached,
              timestamp: Date.now(),
              cacheTime,
            });
            if (onSuccess) {
              onSuccess(persistentCached);
            }
            log.debug(`Données récupérées du cache persistant: ${effectiveCacheKey}`);
          }
          return;
        }
      }
    }

    const setLoadingState = useGlobalLoading ? setGlobalLoading : setLocalLoading;
    setLoadingState(true);
    setError(null);
    setGlobalError(null);
    setIsCached(false);

    try {
      log.debug(`Appel API: ${endpoint}`);
      const result = await ApiClient.get<T>(endpoint, apiOptions);
      
      if (!mountedRef.current) return;

      setData(result);
      setError(null);
      setGlobalError(null);
      retryCountRef.current = 0;
      
      // Mettre en cache (mémoire et persistant si activé)
      if (effectiveCacheKey) {
        apiCache.set(effectiveCacheKey, {
          data: result,
          timestamp: Date.now(),
          cacheTime,
        });
        
        // Cache persistant si activé
        if (usePersistentCache) {
          await persistentCache.set(effectiveCacheKey, result, cacheTime);
        }
      }
      
      if (onSuccess) {
        onSuccess(result);
      }

      log.debug(`API call réussi: ${endpoint}`, { data: result });
    } catch (err) {
      if (!mountedRef.current) return;

      const apiError = err instanceof ApiError ? err : new ApiError(
        err instanceof Error ? err.message : 'Erreur inconnue'
      );

      // Retry en cas d'erreur réseau
      if (retryOnError && retryCountRef.current < retryCount && apiError.isRetryable) {
        retryCountRef.current++;
        log.debug(`Tentative ${retryCountRef.current}/${retryCount} pour ${endpoint}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCountRef.current));
        return execute(skipCache);
      }

      // Si erreur réseau et synchronisation offline activée, queue la requête
      if (enableOfflineSync && apiError.isRetryable) {
        try {
          const syncOptions: any = {};
          if (apiOptions?.baseUrlOverride) {
            syncOptions.baseUrlOverride = apiOptions.baseUrlOverride;
          }
          if (apiOptions?.retry?.maxAttempts && apiOptions?.retry?.delay) {
            syncOptions.retry = {
              maxAttempts: apiOptions.retry.maxAttempts,
              delay: apiOptions.retry.delay,
            };
          }
          
          await offlineSync.queueRequest({
            method: 'GET',
            endpoint,
            options: Object.keys(syncOptions).length > 0 ? syncOptions : undefined,
            maxRetries: retryCount,
          });
          log.info('Requête ajoutée à la queue offline', { endpoint });
        } catch (syncError) {
          log.error('Erreur lors de l\'ajout à la queue offline', syncError as Error);
        }
      }

      setError(apiError);
      setGlobalError(apiError.getUserMessage());
      retryCountRef.current = 0;
      
      log.error(`Erreur API: ${endpoint}`, apiError);
      
      if (onError) {
        onError(apiError);
      }
    } finally {
      if (mountedRef.current) {
        setLoadingState(false);
      }
    }
  }, [
    endpoint,
    apiOptions,
    onSuccess,
    onError,
    useGlobalLoading,
    setGlobalLoading,
    setGlobalError,
    effectiveCacheKey,
    cacheTime,
    retryOnError,
    retryCount,
    usePersistentCache,
    enableOfflineSync,
  ]);

  useEffect(() => {
    if (immediate && endpoint) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, endpoint]);

  const refetch = useCallback(async () => {
    await execute(true); // Skip cache on refetch
  }, [execute]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setGlobalError(null);
    setIsCached(false);
    retryCountRef.current = 0;
    if (effectiveCacheKey) {
      apiCache.delete(effectiveCacheKey);
    }
  }, [setGlobalError, effectiveCacheKey]);

  return {
    data,
    loading: useGlobalLoading ? false : loading,
    error,
    refetch,
    reset,
    isCached,
  };
}

/**
 * Hook pour effectuer des mutations (POST/PUT/PATCH/DELETE) avec gestion d'état optimisée
 */
export function useMutation<TData, TVariables = unknown>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  options: Omit<UseApiOptions<TData>, 'immediate'> = {}
): {
  mutate: (variables?: TVariables) => Promise<TData | null>;
  mutateAsync: (variables?: TVariables) => Promise<TData>;
  data: TData | null;
  loading: boolean;
  error: ApiError | null;
  reset: () => void;
} {
  const {
    apiOptions,
    onSuccess,
    onError,
    useGlobalLoading = false,
    cacheKey,
    enableOfflineSync = false,
  } = options;

  const [data, setData] = useState<TData | null>(null);
  const [loading, setLocalLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const { setLoading: setGlobalLoading } = useLoading();
  const { setError: setGlobalError } = useError();

  const execute = useCallback(async (variables?: TVariables): Promise<TData> => {
    const setLoadingState = useGlobalLoading ? setGlobalLoading : setLocalLoading;
    setLoadingState(true);
    setError(null);
    setGlobalError(null);

    try {
      log.debug(`Mutation API: ${method} ${endpoint}`, { variables });
      
      let result: TData;
      switch (method) {
        case 'POST':
          result = await ApiClient.post<TData>(endpoint, variables, apiOptions);
          break;
        case 'PUT':
          result = await ApiClient.put<TData>(endpoint, variables, apiOptions);
          break;
        case 'PATCH':
          result = await ApiClient.patch<TData>(endpoint, variables, apiOptions);
          break;
        case 'DELETE':
          result = await ApiClient.delete<TData>(endpoint, apiOptions);
          break;
        default:
          throw new Error(`Méthode HTTP non supportée: ${method}`);
      }

      setData(result);
      setError(null);
      setGlobalError(null);
      
      // Invalider le cache si une clé est fournie
      if (cacheKey) {
        apiCache.delete(cacheKey);
        await persistentCache.delete(cacheKey);
      }
      
      if (onSuccess) {
        onSuccess(result);
      }

      log.debug(`Mutation réussie: ${method} ${endpoint}`, { data: result });
      return result;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError(
        err instanceof Error ? err.message : 'Erreur inconnue'
      );

      // Si erreur réseau et synchronisation offline activée, queue la requête
      if (enableOfflineSync && apiError.isRetryable) {
        try {
          const syncOptions: any = {};
          if (apiOptions?.baseUrlOverride) {
            syncOptions.baseUrlOverride = apiOptions.baseUrlOverride;
          }
          if (apiOptions?.retry?.maxAttempts && apiOptions?.retry?.delay) {
            syncOptions.retry = {
              maxAttempts: apiOptions.retry.maxAttempts,
              delay: apiOptions.retry.delay,
            };
          }
          
          await offlineSync.queueRequest({
            method,
            endpoint,
            body: variables,
            options: Object.keys(syncOptions).length > 0 ? syncOptions : undefined,
            maxRetries: 3,
          });
          log.info('Mutation ajoutée à la queue offline', { method, endpoint });
        } catch (syncError) {
          log.error('Erreur lors de l\'ajout à la queue offline', syncError as Error);
        }
      }

      setError(apiError);
      setGlobalError(apiError.getUserMessage());
      
      log.error(`Erreur mutation: ${method} ${endpoint}`, apiError);
      
      if (onError) {
        onError(apiError);
      }

      throw apiError;
    } finally {
      setLoadingState(false);
    }
  }, [endpoint, method, apiOptions, onSuccess, onError, useGlobalLoading, setGlobalLoading, setGlobalError, cacheKey, enableOfflineSync]);

  const mutate = useCallback(async (variables?: TVariables): Promise<TData | null> => {
    try {
      return await execute(variables);
    } catch {
      return null;
    }
  }, [execute]);

  const mutateAsync = useCallback(async (variables?: TVariables): Promise<TData> => {
    return await execute(variables);
  }, [execute]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setGlobalError(null);
  }, [setGlobalError]);

  return {
    mutate,
    mutateAsync,
    data,
    loading: useGlobalLoading ? false : loading,
    error,
    reset,
  };
}

/**
 * Invalide le cache pour une clé spécifique ou tout le cache
 */
export function invalidateCache(key?: string): void {
  if (key) {
    apiCache.delete(key);
    log.debug(`Cache invalidé pour: ${key}`);
  } else {
    apiCache.clear();
    log.debug('Cache complètement vidé');
  }
}

