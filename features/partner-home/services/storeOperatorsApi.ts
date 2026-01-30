import { API_BASE_URL } from '@/services/auth.service';
import { ApiClient } from '@/services/shared/api-client';
import { log } from '@/utils/logger';

const STORE_OPERATORS_API_BASE_URL = API_BASE_URL?.replace(/\/api\/v1$/i, '/api/v1') || API_BASE_URL || '';

export interface ActiveStoreResponse {
  id: string;
  name?: string;
  partnerId?: string;
  address?: any;
  [key: string]: any;
}

export interface SetActiveStoreRequest {
  storeId: string;
}

export const StoreOperatorsApi = {
  /**
   * Récupère le store actif de l'opérateur connecté
   * GET /api/v1/store-operators/active-store
   */
  getActiveStore: async (): Promise<ActiveStoreResponse | null> => {
    log.info('Récupération du store actif');

    try {
      const response = await ApiClient.get<ActiveStoreResponse>('/store-operators/active-store', {
        baseUrlOverride: STORE_OPERATORS_API_BASE_URL,
      });

      return response || null;
    } catch (error) {
      log.error('Erreur lors de la récupération du store actif', error as Error);
      // Si l'erreur est 404, cela signifie qu'aucun store n'est actif
      if ((error as any)?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Définit le store actif pour l'opérateur connecté
   * POST /api/v1/store-operators/set-active-store
   */
  setActiveStore: async (storeId: string): Promise<ActiveStoreResponse> => {
    log.info('Définition du store actif', { storeId });

    if (!storeId) {
      throw new Error('Store ID requis');
    }

    try {
      const response = await ApiClient.post<any>(
        '/store-operators/set-active-store',
        {
          storeId,
        },
        {
          baseUrlOverride: STORE_OPERATORS_API_BASE_URL,
        }
      );

      log.debug('Réponse API setActiveStore:', response);

      // L'API retourne : { "message": "Active store set successfully", "storeId": "..." }
      // On doit extraire le storeId de la réponse
      const responseStoreId = response?.storeId || response?.data?.storeId || storeId;
      
      if (!responseStoreId) {
        throw new Error('Réponse API invalide - pas de storeId trouvé');
      }

      // Retourner un objet ActiveStoreResponse avec l'ID du store
      return {
        id: responseStoreId,
        ...response,
      } as ActiveStoreResponse;
    } catch (error) {
      log.error('Erreur lors de la définition du store actif', error as Error);
      throw error;
    }
  },
};

