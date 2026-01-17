import { useState, useEffect, useCallback } from 'react';
import { HomeApi } from '../services/homeApi';
import { QrTokenData, Transaction } from '../types';
import { useAuth } from '@/hooks/use-auth';

export const useHome = () => {
  const { user } = useAuth();
  const [qrData, setQrData] = useState<QrTokenData | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrError, setQrError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  const fetchQrCode = useCallback(async () => {
    if (!user?.id) return;
    
    setQrLoading(true);
    setQrError(null);
    try {
      const data = await HomeApi.getQrCode();
      setQrData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement du QR code';
      setQrError(errorMessage);
      console.error('Erreur useHome fetchQrCode:', err);
    } finally {
      setQrLoading(false);
    }
  }, [user?.id]);

  const fetchTransactions = useCallback(async () => {
    if (!user?.id) return;
    
    setTransactionsLoading(true);
    try {
      const data = await HomeApi.getUserTransactions(user.id, 1, 10);
      setTransactions(data);
    } catch (err) {
      console.error('Erreur useHome fetchTransactions:', err);
    } finally {
      setTransactionsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchQrCode();
    fetchTransactions();
  }, [fetchQrCode, fetchTransactions]);

  return {
    qrData,
    qrLoading,
    qrError,
    transactions,
    transactionsLoading,
    refetchQrCode: fetchQrCode,
    refetchTransactions: fetchTransactions,
  };
};

