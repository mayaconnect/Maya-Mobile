import { API_BASE_URL } from '@/services/auth.service';
import { ApiClient } from '@/services/shared/api-client';
import { log } from '@/utils/logger';

const SUBSCRIPTIONS_API_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/i, '/api');

export interface SubscriptionQueryParams {
  page?: number;
  pageSize?: number;
}

export interface SubscriptionListResponse<T = any> {
  items: T[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
}

export interface CreateSubscriptionRequest {
  userId: string;
  planId: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface UpdateSubscriptionRequest {
  planId?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export const SubscriptionsApi = {
  /**
   * Liste les abonnements avec pagination (Admin uniquement)
   */
  getSubscriptions: async (filters: SubscriptionQueryParams = {}): Promise<SubscriptionListResponse> => {
    log.info('Récupération des abonnements', filters);

    const params = new URLSearchParams();

    if (filters.page !== undefined) {
      params.append('page', String(filters.page));
    }
    if (filters.pageSize !== undefined) {
      params.append('pageSize', String(filters.pageSize));
    }

    const query = params.toString();
    const endpoint = `/subscriptions${query ? `?${query}` : ''}`;

    try {
      const response = await ApiClient.get<any>(endpoint, {
        baseUrlOverride: SUBSCRIPTIONS_API_BASE_URL,
      });

      let result: SubscriptionListResponse;

      if (Array.isArray(response)) {
        result = {
          items: response,
          page: filters.page,
          pageSize: filters.pageSize ?? response.length,
          totalCount: response.length,
        };
      } else if (response?.items && Array.isArray(response.items)) {
        result = {
          items: response.items,
          page: response.page ?? filters.page,
          pageSize: response.pageSize ?? filters.pageSize,
          totalCount: response.totalCount ?? response.total ?? response.count,
        };
      } else if (response?.data && Array.isArray(response.data)) {
        result = {
          items: response.data,
          page: response.page ?? filters.page,
          pageSize: response.pageSize ?? filters.pageSize,
          totalCount: response.totalCount ?? response.total ?? response.count,
        };
      } else {
        result = {
          items: [],
          page: filters.page,
          pageSize: filters.pageSize,
          totalCount: 0,
        };
      }

      return result;
    } catch (error) {
      log.error('Erreur lors de la récupération des abonnements', error as Error);
      throw error;
    }
  },

  /**
   * Récupère les plans d'abonnement disponibles
   */
  getPlans: async (): Promise<any[]> => {
    log.info('Récupération des plans d\'abonnement');

    try {
      const response = await ApiClient.get<any>('/subscriptions/plans', {
        baseUrlOverride: SUBSCRIPTIONS_API_BASE_URL,
      });

      if (Array.isArray(response)) {
        return response;
      }

      if (response?.items && Array.isArray(response.items)) {
        return response.items;
      }

      if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      log.error('Erreur lors de la récupération des plans', error as Error);
      throw error;
    }
  },

  /**
   * Vérifie si l'utilisateur connecté a un abonnement actif
   */
  hasActiveSubscription: async (): Promise<boolean> => {
    log.info('Vérification de l\'abonnement actif');

    try {
      const response = await ApiClient.get<{ hasSubscription: boolean }>(
        '/Users/me/has-subscription',
        {
          baseUrlOverride: SUBSCRIPTIONS_API_BASE_URL,
        }
      );

      return response?.hasSubscription ?? false;
    } catch (error) {
      log.error('Erreur lors de la vérification de l\'abonnement', error as Error);

      // Si l'erreur est 404 ou 401, considérer qu'il n'y a pas d'abonnement
      if (error instanceof Error && (error.message.includes('404') || error.message.includes('401'))) {
        return false;
      }

      throw error;
    }
  },

  /**
   * Récupère l'abonnement actif de l'utilisateur connecté
   */
  getMyActiveSubscription: async (): Promise<any | null> => {
    log.info('Récupération de l\'abonnement actif');

    try {
      const response = await ApiClient.get<any>('/Users/me/subscription', {
        baseUrlOverride: SUBSCRIPTIONS_API_BASE_URL,
      });

      return response || null;
    } catch (error) {
      log.error('Erreur lors de la récupération de l\'abonnement', error as Error);

      // Si l'erreur est 404 ou 401, cela signifie qu'il n'y a pas d'abonnement actif
      if (error instanceof Error && (error.message.includes('404') || error.message.includes('401'))) {
        return null;
      }

      throw error;
    }
  },
};

