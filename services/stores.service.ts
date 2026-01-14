import { API_BASE_URL, AuthService } from './auth.service';
import { apiCall } from './shared/api';

const STORES_API_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/i, '/api');

const storesApiCall = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = await AuthService.getAccessToken();
  console.log('🔑 [Stores Service] Token disponible:', token ? token.substring(0, 20) + '...' : 'Aucun');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    console.log('✅ [Stores Service] Token ajouté aux headers');
  } else {
    console.warn('⚠️ [Stores Service] Aucun token disponible');
  }

  const finalOptions: RequestInit = {
    ...options,
    headers,
  };

 

  return apiCall<T>(endpoint, finalOptions, 0, STORES_API_BASE_URL);
};

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

export const StoresService = {
  /**
   * Récupère les magasins liés à l'utilisateur connecté via la route /stores/me (auth)
   */
  getMyStores: async (): Promise<StoreSearchResponse> => {
    

    try {
      const startTime = Date.now();
      const response = await storesApiCall<any>('/stores/me');
      const duration = Date.now() - startTime;

      

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
        console.warn('⚠️ [Stores Service] Format de réponse inattendu pour /stores/me, retour d\'un tableau vide');
        result = {
          items: [],
          page: 1,
          pageSize: 0,
          totalCount: 0,
        };
      }

      console.log('✅ [Stores Service] Résultat final /stores/me:', {
        itemsCount: result.items.length,
        page: result.page,
        pageSize: result.pageSize,
        totalCount: result.totalCount,
      });

      return result;
    } catch (error) {
      console.error('❌ [Stores Service] Erreur lors de l\'appel /stores/me:', error);
      if (error instanceof Error) {
        console.error('❌ [Stores Service] Détails de l\'erreur /stores/me:', {
          message: error.message,
          name: error.name,
        });
      }
      throw error;
    }
  },

  /**
   * Recherche des magasins par localisation/filtres avec pagination (auth)
   */
  searchStores: async (searchParams: StoreSearchParams = {}): Promise<StoreSearchResponse> => {
    console.log('🔍 [Stores Service] searchStores appelé');
    console.log('📋 [Stores Service] Paramètres de recherche:', JSON.stringify(searchParams, null, 2));
    console.log('🌐 [Stores Service] Appel API: POST /api/stores/search');
    console.log('🌐 [Stores Service] Base URL:', STORES_API_BASE_URL);

    try {
      const startTime = Date.now();
      const response = await storesApiCall<any>('/stores/search', {
        method: 'POST',
        body: JSON.stringify(searchParams),
      });
      const duration = Date.now() - startTime;

      console.log('✅ [Stores Service] Réponse API reçue', {
        duration: duration + 'ms',
        responseType: typeof response,
        isArray: Array.isArray(response),
        hasItems: !!response?.items,
        hasData: !!response?.data,
        itemsCount: Array.isArray(response) ? response.length : (response?.items?.length || response?.data?.length || 0),
      });

      if (response) {
        console.log('📄 [Stores Service] Structure de la réponse:', {
          keys: Object.keys(response),
          firstItem: Array.isArray(response) ? response[0] : (response?.items?.[0] || response?.data?.[0] || null),
        });
      }

      let result: StoreSearchResponse;

      if (Array.isArray(response)) {
        console.log('📦 [Stores Service] Réponse est un tableau direct');
        result = {
          items: response,
          page: searchParams.page,
          pageSize: searchParams.pageSize ?? response.length,
          totalCount: response.length,
        };
      } else if (response?.items && Array.isArray(response.items)) {
        console.log('📦 [Stores Service] Réponse contient un champ items');
        result = {
          items: response.items,
          page: response.page ?? searchParams.page,
          pageSize: response.pageSize ?? searchParams.pageSize,
          totalCount: response.totalCount ?? response.total ?? response.count,
        };
      } else if (response?.data && Array.isArray(response.data)) {
        console.log('📦 [Stores Service] Réponse contient un champ data');
        result = {
          items: response.data,
          page: response.page ?? searchParams.page,
          pageSize: response.pageSize ?? searchParams.pageSize,
          totalCount: response.totalCount ?? response.total ?? response.count,
        };
      } else {
        console.warn('⚠️ [Stores Service] Format de réponse inattendu, retour d\'un tableau vide');
        result = {
          items: [],
          page: searchParams.page,
          pageSize: searchParams.pageSize,
          totalCount: 0,
        };
      }

      console.log('✅ [Stores Service] Résultat final:', {
        itemsCount: result.items.length,
        page: result.page,
        pageSize: result.pageSize,
        totalCount: result.totalCount,
      });

      return result;
    } catch (error) {
      console.error('❌ [Stores Service] Erreur lors de la recherche des stores:', error);
      if (error instanceof Error) {
        console.error('❌ [Stores Service] Détails de l\'erreur:', {
          message: error.message,
          name: error.name,
        });
      }
      throw error;
    }
  },

  /**
   * Récupère les détails d'un magasin (inclut le flag IsUsual pour l'utilisateur demandeur) (auth)
   */
  getStoreById: async (id: string): Promise<any> => {
    console.log('🔍 [Stores Service] getStoreById appelé');
    console.log('🆔 [Stores Service] Store ID:', id);

    if (!id) {
      console.error('❌ [Stores Service] Store ID manquant');
      throw new Error('Store ID requis');
    }

    console.log('🌐 [Stores Service] Appel API: GET /api/stores/' + id);
    console.log('🌐 [Stores Service] Base URL:', STORES_API_BASE_URL);

    try {
      const startTime = Date.now();
      const response = await storesApiCall<any>(`/stores/${id}`);
      const duration = Date.now() - startTime;

      console.log('✅ [Stores Service] Détails du store récupérés', {
        duration: duration + 'ms',
        hasId: !!response?.id,
        hasName: !!response?.name,
        hasAddress: !!response?.address,
        hasPartner: !!response?.partner,
        responseKeys: response ? Object.keys(response) : [],
      });

      if (response) {
        console.log('📄 [Stores Service] Contenu de la réponse:', {
          id: response.id,
          name: response.name || response.partner?.name,
          category: response.category,
          address: response.address,
          isOpen: response.isOpen,
          hasPartner: !!response.partner,
          fullResponse: JSON.stringify(response, null, 2),
        });
      }

      return response;
    } catch (error) {
      console.error('❌ [Stores Service] Erreur lors de la récupération des détails du store:', error);
      if (error instanceof Error) {
        console.error('❌ [Stores Service] Détails de l\'erreur:', {
          message: error.message,
          name: error.name,
        });
      }
      throw error;
    }
  },
};

