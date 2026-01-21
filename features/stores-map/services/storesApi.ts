import { API_BASE_URL } from '@/services/auth.service';
import { ApiClient } from '@/services/shared/api-client';
import { log } from '@/utils/logger';

const STORES_API_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/i, '/api');

export interface StoreSearchParams {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  category?: string;
  minDiscount?: number;
  sort?: string;
  name?: string;
  page?: number;
  pageSize?: number;
}

export interface StoreSearchResponse<T = any> {
  items: T[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
}

export const StoresApi = {
  /**
   * Récupère les magasins liés à l'utilisateur connecté via la route /stores/me (auth)
   */
  getMyStores: async (): Promise<StoreSearchResponse> => {
    log.info('Récupération des magasins de l\'utilisateur');

    try {
      const response = await ApiClient.get<any>('/stores/me', {
        baseUrlOverride: STORES_API_BASE_URL,
      });

      let result: StoreSearchResponse;

      if (Array.isArray(response)) {
        result = {
          items: response,
          page: 1,
          pageSize: response.length,
          totalCount: response.length,
        };
      } else if (response?.items && Array.isArray(response.items)) {
        result = {
          items: response.items,
          page: response.page ?? 1,
          pageSize: response.pageSize ?? response.items.length,
          totalCount: response.totalCount ?? response.total ?? response.count ?? response.items.length,
        };
      } else if (response?.data && Array.isArray(response.data)) {
        result = {
          items: response.data,
          page: response.page ?? 1,
          pageSize: response.pageSize ?? response.data.length,
          totalCount: response.totalCount ?? response.total ?? response.count ?? response.data.length,
        };
      } else {
        result = {
          items: [],
          page: 1,
          pageSize: 0,
          totalCount: 0,
        };
      }

      return result;
    } catch (error) {
      log.error('Erreur lors de l\'appel /stores/me', error as Error);
      throw error;
    }
  },

  /**
   * Recherche des magasins par localisation/filtres avec pagination (auth)
   */
  searchStores: async (searchParams: StoreSearchParams = {}): Promise<StoreSearchResponse> => {
    log.info('Recherche de magasins', searchParams);

    try {
      const response = await ApiClient.post<any>('/stores/search', searchParams, {
        baseUrlOverride: STORES_API_BASE_URL,
      });

      let result: StoreSearchResponse;

      if (Array.isArray(response)) {
        result = {
          items: response,
          page: searchParams.page,
          pageSize: searchParams.pageSize ?? response.length,
          totalCount: response.length,
        };
      } else if (response?.items && Array.isArray(response.items)) {
        result = {
          items: response.items,
          page: response.page ?? searchParams.page,
          pageSize: response.pageSize ?? searchParams.pageSize,
          totalCount: response.totalCount ?? response.total ?? response.count,
        };
      } else if (response?.data && Array.isArray(response.data)) {
        result = {
          items: response.data,
          page: response.page ?? searchParams.page,
          pageSize: response.pageSize ?? searchParams.pageSize,
          totalCount: response.totalCount ?? response.total ?? response.count,
        };
      } else {
        result = {
          items: [],
          page: searchParams.page,
          pageSize: searchParams.pageSize,
          totalCount: 0,
        };
      }

      return result;
    } catch (error) {
      log.error('Erreur lors de la recherche des stores', error as Error);
      throw error;
    }
  },

  /**
   * Récupère les détails d'un magasin (inclut le flag IsUsual pour l'utilisateur demandeur) (auth)
   */
  getStoreById: async (id: string): Promise<any> => {
    log.info('Récupération des détails du magasin', { id });

    if (!id) {
      throw new Error('Store ID requis');
    }

    try {
      const response = await ApiClient.get<any>(`/stores/${id}`, {
        baseUrlOverride: STORES_API_BASE_URL,
      });

      return response;
    } catch (error) {
      log.error('Erreur lors de la récupération des détails du store', error as Error);
      throw error;
    }
  },
};

