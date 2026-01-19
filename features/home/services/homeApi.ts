import { QrApi } from './qrApi';
import { TransactionsApi } from './transactionsApi';
import { QrTokenData, Transaction, SavingsByCategory } from '../types';

export const HomeApi = {
  getQrCode: async (): Promise<QrTokenData | null> => {
    try {
      const response = await QrApi.issueQrToken();
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération du QR code:', error);
      throw error;
    }
  },

  getUserTransactions: async (userId: string, page: number = 1, pageSize: number = 10): Promise<Transaction[]> => {
    try {
      const response = await TransactionsApi.getUserTransactions(userId, {
        page,
        pageSize,
      });
      return response.items || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions:', error);
      throw error;
    }
  },

  getSavingsByCategory: async (userId: string, period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<SavingsByCategory[]> => {
    try {
      const response = await TransactionsApi.getUserSavingsByCategory(userId);
      return response || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des économies par catégorie:', error);
      throw error;
    }
  },
};

