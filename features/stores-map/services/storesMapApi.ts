import { StoresService } from '@/services/stores.service';
import { StoreSearchParams, Store } from '../types';

export const StoresMapApi = {
  searchStores: async (params: StoreSearchParams = {}): Promise<Store[]> => {
    try {
      const response = await StoresService.searchStores(params);
      return response.items as Store[];
    } catch (error) {
      console.error('Erreur lors de la recherche de stores:', error);
      throw error;
    }
  },

  getStoreById: async (id: string): Promise<Store> => {
    try {
      const store = await StoresService.getStoreById(id);
      return store as Store;
    } catch (error) {
      console.error('Erreur lors de la récupération du store:', error);
      throw error;
    }
  },
};

