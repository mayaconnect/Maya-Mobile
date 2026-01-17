import { StoresService } from '@/services/stores.service';
import { TransactionsService } from '@/services/transactions.service';
import { PartnerStore, PartnerTransaction, PartnerStats } from '../types';

export const PartnerHomeApi = {
  getMyStores: async (): Promise<PartnerStore[]> => {
    try {
      const response = await StoresService.getMyStores();
      return response.items as PartnerStore[];
    } catch (error) {
      console.error('Erreur lors de la récupération des stores:', error);
      throw error;
    }
  },

  getPartnerTransactions: async (
    partnerId: string,
    filters: { page?: number; pageSize?: number; storeId?: string } = {}
  ): Promise<PartnerTransaction[]> => {
    try {
      const response = await TransactionsService.getPartnerTransactions(partnerId, filters);
      return response.items as PartnerTransaction[];
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions partenaire:', error);
      throw error;
    }
  },

  getPartnerStats: async (partnerId: string): Promise<PartnerStats> => {
    try {
      const transactions = await TransactionsService.getPartnerTransactions(partnerId, {
        page: 1,
        pageSize: 1000,
      });
      
      const today = new Date().toISOString().split('T')[0];
      const todayTransactions = transactions.items.filter(t => t.date?.startsWith(today));
      
      const totalRevenue = transactions.items.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalDiscounts = transactions.items.reduce((sum, t) => sum + (t.discount || 0), 0);
      const todayRevenue = todayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      
      return {
        totalTransactions: transactions.items.length,
        totalRevenue,
        totalDiscounts,
        todayTransactions: todayTransactions.length,
        todayRevenue,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des stats partenaire:', error);
      throw error;
    }
  },
};

