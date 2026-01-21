/**
 * Version optimisée de useHome utilisant useApi et useMutation
 * Cette version sera progressivement migrée pour remplacer useHome.ts
 */

import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useApi, useMutation } from '@/hooks/use-api';
import { useAuth } from '@/hooks/use-auth';
import { QrTokenData, Transaction } from '../types';
import { API_CONFIG } from '@/config/api.config';
import { ApiClient } from '@/services/shared/api-client';

/**
 * Hook optimisé pour la page d'accueil
 * Utilise useApi avec cache pour améliorer les performances
 */
export const useHomeOptimized = () => {
  const { user } = useAuth();

  // Construire l'URL de base pour QR (utilise /api au lieu de /api/v1)
  const qrBaseUrl = useMemo(() => {
    return API_CONFIG.BASE_URL.includes('/api/v1')
      ? API_CONFIG.BASE_URL.replace('/api/v1', '/api')
      : API_CONFIG.BASE_URL;
  }, []);

  // État local pour le QR Code (car c'est un POST, pas un GET)
  const [qrData, setQrData] = useState<QrTokenData | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrIsCached, setQrIsCached] = useState(false);

  // Hook pour générer le QR Code (POST)
  const {
    mutateAsync: generateQrToken,
    loading: qrGenerating,
    error: qrMutationError,
  } = useMutation<QrTokenData, void>(
    '/qr/issue-token-frontend',
    'POST',
    {
      cacheKey: `qr-token-${user?.id}`,
      apiOptions: {
        baseUrlOverride: qrBaseUrl,
      },
      onSuccess: (data) => {
        setQrData(data);
        setQrIsCached(false);
        setQrError(null);
      },
      onError: (error) => {
        setQrError(error.getUserMessage());
        // Si erreur 403, on peut utiliser un fallback local
        if (error.statusCode === 403) {
          console.warn('⚠️ [QR Service] Accès refusé, utilisation d\'un QR local de fallback');
        }
      },
    }
  );

  // Fonction pour charger le QR Code
  const fetchQrCode = useCallback(async () => {
    if (!user?.id) {
      setQrLoading(false);
      return;
    }

    setQrLoading(true);
    setQrError(null);

    try {
      // Vérifier le cache local d'abord (AsyncStorage via QrService)
      // Pour simplifier, on génère directement un nouveau token
      const result = await generateQrToken();
      setQrData(result);
      setQrIsCached(false);
    } catch (error) {
      // Erreur déjà gérée par onError de useMutation
    } finally {
      setQrLoading(false);
    }
  }, [user?.id, generateQrToken]);

  useEffect(() => {
    if (user?.id) {
      fetchQrCode();
    }
  }, [user?.id, fetchQrCode]);

  // Hook pour les transactions avec cache de 2 minutes
  const transactionsEndpoint = useMemo(() => {
    if (!user?.id) return null;
    const params = new URLSearchParams();
    params.append('page', '1');
    params.append('pageSize', '10');
    return `/transactions/user/${user.id}?${params.toString()}`;
  }, [user?.id]);

  // Construire l'URL de base pour transactions
  const transactionsBaseUrl = useMemo(() => {
    return API_CONFIG.BASE_URL.replace(/\/api\/v1$/i, '/api');
  }, []);

  const {
    data: transactionsResponse,
    loading: transactionsLoading,
    refetch: refetchTransactions,
    isCached: transactionsIsCached,
  } = useApi<{ items: Transaction[] } | Transaction[]>(
    transactionsEndpoint,
    {
      cacheKey: `transactions-${user?.id}-1-10`,
      cacheTime: 2 * 60 * 1000, // 2 minutes
      apiOptions: {
        baseUrlOverride: transactionsBaseUrl,
      },
      retryOnError: true,
      retryCount: 2,
    }
  );

  // Normaliser la réponse des transactions
  const transactions = useMemo(() => {
    if (!transactionsResponse) return [];
    if (Array.isArray(transactionsResponse)) return transactionsResponse;
    if ('items' in transactionsResponse && Array.isArray(transactionsResponse.items)) {
      return transactionsResponse.items;
    }
    return [];
  }, [transactionsResponse]);

  return {
    qrData,
    qrLoading: qrLoading || qrGenerating,
    qrError: qrError || qrMutationError?.getUserMessage() || null,
    transactions,
    transactionsLoading,
    refetchQrCode: fetchQrCode,
    refetchTransactions,
    qrIsCached,
    transactionsIsCached,
  };
};
