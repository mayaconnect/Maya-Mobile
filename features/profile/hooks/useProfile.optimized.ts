/**
 * Version optimisée de useProfile utilisant useApi et useMutation
 * Cette version sera progressivement migrée pour remplacer useProfile.ts
 */

import { API_CONFIG } from '@/config/api.config';
import { invalidateCache, useApi, useMutation } from '@/hooks/use-api';
import { useAuth } from '@/hooks/use-auth';
import { useMemo } from 'react';
import { UserProfile } from '../types';

/**
 * Hook optimisé pour le profil utilisateur
 * Utilise useApi pour GET et useMutation pour PUT/PATCH
 */
export const useProfileOptimized = () => {
  const { user } = useAuth();

  // Construire l'URL de base pour client (utilise /api au lieu de /api/v1)
  const clientBaseUrl = useMemo(() => {
    return API_CONFIG.BASE_URL.replace(/\/api\/v1$/i, '/api');
  }, []);

  // Hook pour récupérer le profil avec cache de 5 minutes
  // Utilise /api/v1/auth/me (endpoint d'authentification)
  const {
    data: profile,
    loading,
    error,
    refetch,
    isCached,
  } = useApi<UserProfile>(
    user?.id ? '/auth/me' : null,
    {
      cacheKey: `profile-${user?.id}`,
      cacheTime: 5 * 60 * 1000, // 5 minutes
      retryOnError: true,
    }
  );

  // Hook pour mettre à jour le profil
  // Utilise /api/clients/${userId} (endpoint client)
  const {
    mutateAsync: updateProfileAsync,
    loading: updating,
    error: updateError,
  } = useMutation<UserProfile, Partial<UserProfile>>(
    user?.id ? `/clients/${user.id}` : '/clients/profile',
    'PUT',
    {
      cacheKey: `profile-${user?.id}`, // Invalide le cache après mise à jour
      apiOptions: {
        baseUrlOverride: clientBaseUrl,
      },
      onSuccess: () => {
        // Invalider le cache pour forcer le refetch
        invalidateCache(`profile-${user?.id}`);
        refetch();
      },
    }
  );

  const updateProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    if (!user?.id) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      return await updateProfileAsync(updates);
    } catch (err) {
      throw err;
    }
  };

  return {
    profile: profile || null,
    loading,
    error: error?.getUserMessage() || null,
    refetch,
    updateProfile,
    updating,
    updateError: updateError?.getUserMessage() || null,
    isCached, // Indique si les données viennent du cache
  };
};

