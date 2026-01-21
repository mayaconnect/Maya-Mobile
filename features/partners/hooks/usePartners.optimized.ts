/**
 * Version optimisée de usePartners utilisant useApi avec debounce pour la recherche
 * Cette version sera progressivement migrée pour remplacer usePartners.ts
 */

import { useMemo } from 'react';
import { useApi } from '@/hooks/use-api';
import { useDebouncedValue } from '@/hooks/use-debounced';
import { Partner, PartnerQueryParams, PartnerListResponse } from '../types';
import { API_CONFIG } from '@/config/api.config';

/**
 * Hook optimisé pour les partenaires avec recherche debounced
 * Utilise useApi avec cache et debounce pour optimiser les recherches
 */
export const usePartnersOptimized = (initialFilters?: PartnerQueryParams) => {
  // Debounce les filtres de recherche pour éviter trop d'appels API
  const debouncedFilters = useDebouncedValue(initialFilters, 500);

  // Construire l'endpoint avec les query params
  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    const filters = debouncedFilters || {};

    if (filters.name) params.append('name', filters.name);
    if (filters.email) params.append('email', filters.email);
    if (typeof filters.isActive === 'boolean') {
      params.append('isActive', String(filters.isActive));
    }
    if (filters.page) params.append('page', String(filters.page));
    if (filters.pageSize) params.append('pageSize', String(filters.pageSize));
    if (filters.category) params.append('category', filters.category);
    if (filters.latitude) params.append('latitude', String(filters.latitude));
    if (filters.longitude) params.append('longitude', String(filters.longitude));
    if (filters.radiusKm) params.append('radiusKm', String(filters.radiusKm));

    const query = params.toString();
    return `/partners${query ? `?${query}` : ''}`;
  }, [debouncedFilters]);

  // Construire la clé de cache basée sur les filtres
  const cacheKey = useMemo(() => {
    return `partners-${JSON.stringify(debouncedFilters || {})}`;
  }, [debouncedFilters]);

  // Construire l'URL de base pour partners (utilise /api au lieu de /api/v1)
  const partnersBaseUrl = useMemo(() => {
    return API_CONFIG.BASE_URL.replace(/\/api\/v1$/i, '/api');
  }, []);

  const {
    data: response,
    loading,
    error,
    refetch,
    isCached,
  } = useApi<PartnerListResponse | Partner[]>(endpoint, {
    cacheKey,
    cacheTime: 3 * 60 * 1000, // 3 minutes
    apiOptions: {
      baseUrlOverride: partnersBaseUrl,
    },
    retryOnError: true,
    retryCount: 2,
  });

  // Normaliser la réponse (peut être un tableau direct ou un objet avec items)
  const partners = useMemo(() => {
    if (!response) return [];
    
    if (Array.isArray(response)) {
      return response;
    }
    
    if ('items' in response && Array.isArray(response.items)) {
      return response.items;
    }
    
    return [];
  }, [response]);

  return {
    partners,
    loading,
    error: error?.getUserMessage() || null,
    refetch,
    isCached, // Indique si les données viennent du cache
  };
};

