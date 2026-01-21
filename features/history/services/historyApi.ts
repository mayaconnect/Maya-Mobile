import { TransactionsApi } from '@/features/home/services/transactionsApi';
import { TransactionListResponse, TransactionQueryParams } from '../types';

export const HistoryApi = {
  getUserTransactions: async (
    userId: string,
    filters: TransactionQueryParams = {}
  ): Promise<TransactionListResponse> => {
    try {
      const response = await TransactionsApi.getUserTransactions(userId, filters);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      throw error;
    }
  },
};