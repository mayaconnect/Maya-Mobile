import { useState, useEffect, useCallback } from 'react';
import { HistoryApi } from '../services/historyApi';
import { Transaction, TransactionQueryParams } from '../types';
import { useAuth } from '@/hooks/use-auth';

export const useHistory = (initialFilters?: TransactionQueryParams) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (filters?: TransactionQueryParams) => {
    if (!user?.id) {
      setError('Utilisateur non connecté');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await HistoryApi.getUserTransactions(user.id, filters || initialFilters);
      setTransactions(response.items || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de l\'historique';
      setError(errorMessage);
      console.error('Erreur useHistory:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, initialFilters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
  };
};

