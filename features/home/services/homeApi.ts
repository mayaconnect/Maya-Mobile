import { QrService } from '@/services/qr.service';
import { TransactionsService } from '@/services/transactions.service';
import { QrTokenData, Transaction, SavingsByCategory } from '../types';

export const HomeApi = {
  getQrCode: async (): Promise<QrTokenData | null> => {
    try {
      const response = await QrService.getQrToken();
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération du QR code:', error);
      throw error;
    }
  },

  getUserTransactions: async (userId: string, page: number = 1, pageSize: number = 10): Promise<Transaction[]> => {
    try {
      const response = await TransactionsService.getUserTransactions(userId, {
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
      const response = await TransactionsService.getSavingsByCategory(userId, period);
      return response || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des économies par catégorie:', error);
      throw error;
    }
  },
};

