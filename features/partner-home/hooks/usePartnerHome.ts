import { useState, useEffect, useCallback } from 'react';
import { PartnerHomeApi } from '../services/partnerHomeApi';
import { PartnerStore, PartnerTransaction, PartnerStats } from '../types';
import { useAuth } from '@/hooks/use-auth';

export const usePartnerHome = () => {
  const { user } = useAuth();
  const [stores, setStores] = useState<PartnerStore[]>([]);
  const [transactions, setTransactions] = useState<PartnerTransaction[]>([]);
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Pour un partenaire, l'ID peut être dans user.id ou user.partnerId
    const partnerId = (user as any)?.partnerId || user?.id;
    
    if (!partnerId) {
      setError('ID partenaire non disponible');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [storesData, transactionsData, statsData] = await Promise.all([
        PartnerHomeApi.getMyStores(),
        PartnerHomeApi.getPartnerTransactions(partnerId, { page: 1, pageSize: 10 }),
        PartnerHomeApi.getPartnerStats(partnerId),
      ]);

      setStores(storesData);
      setTransactions(transactionsData);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des données';
      setError(errorMessage);
      console.error('Erreur usePartnerHome:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    stores,
    transactions,
    stats,
    loading,
    error,
    refetch: fetchData,
  };
};

