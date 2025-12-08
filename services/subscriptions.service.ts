import { API_BASE_URL, AuthService } from './auth.service';
import { apiCall } from './shared/api';

const SUBSCRIPTIONS_API_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/i, '/api');

const subscriptionsApiCall = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = await AuthService.getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return apiCall<T>(endpoint, { ...options, headers }, 0, SUBSCRIPTIONS_API_BASE_URL);
};

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

export const SubscriptionsService = {
  /**
   * Liste les abonnements avec pagination (Admin uniquement)
   * GET /api/subscriptions?page=1&pageSize=20
   */
  getSubscriptions: async (filters: SubscriptionQueryParams = {}): Promise<SubscriptionListResponse> => {
    console.log('🔍 [Subscriptions Service] getSubscriptions appelé');
    console.log('📋 [Subscriptions Service] Paramètres:', JSON.stringify(filters, null, 2));

    const params = new URLSearchParams();

    if (filters.page !== undefined) {
      params.append('page', String(filters.page));
    }
    if (filters.pageSize !== undefined) {
      params.append('pageSize', String(filters.pageSize));
    }

    const query = params.toString();
    const endpoint = `/subscriptions${query ? `?${query}` : ''}`;

    console.log('🌐 [Subscriptions Service] Appel API: GET', endpoint);
    console.log('🌐 [Subscriptions Service] Base URL:', SUBSCRIPTIONS_API_BASE_URL);

    try {
      const startTime = Date.now();
      const response = await subscriptionsApiCall<any>(endpoint);
      const duration = Date.now() - startTime;

      console.log('✅ [Subscriptions Service] Réponse API reçue', {
        duration: duration + 'ms',
        responseType: typeof response,
        isArray: Array.isArray(response),
        hasItems: !!response?.items,
        hasData: !!response?.data,
        itemsCount: Array.isArray(response) ? response.length : (response?.items?.length || response?.data?.length || 0),
      });

      if (response) {
        console.log('📄 [Subscriptions Service] Structure de la réponse:', {
          keys: Object.keys(response),
          firstItem: Array.isArray(response) ? response[0] : (response?.items?.[0] || response?.data?.[0] || null),
        });
      }

      let result: SubscriptionListResponse;

      if (Array.isArray(response)) {
        console.log('📦 [Subscriptions Service] Réponse est un tableau direct');
        result = {
          items: response,
          page: filters.page,
          pageSize: filters.pageSize ?? response.length,
          totalCount: response.length,
        };
      } else if (response?.items && Array.isArray(response.items)) {
        console.log('📦 [Subscriptions Service] Réponse contient un champ items');
        result = {
          items: response.items,
          page: response.page ?? filters.page,
          pageSize: response.pageSize ?? filters.pageSize,
          totalCount: response.totalCount ?? response.total ?? response.count,
        };
      } else if (response?.data && Array.isArray(response.data)) {
        console.log('📦 [Subscriptions Service] Réponse contient un champ data');
        result = {
          items: response.data,
          page: response.page ?? filters.page,
          pageSize: response.pageSize ?? filters.pageSize,
          totalCount: response.totalCount ?? response.total ?? response.count,
        };
      } else {
        console.warn('⚠️ [Subscriptions Service] Format de réponse inattendu, retour d\'un tableau vide');
        result = {
          items: [],
          page: filters.page,
          pageSize: filters.pageSize,
          totalCount: 0,
        };
      }

      console.log('✅ [Subscriptions Service] Résultat final:', {
        itemsCount: result.items.length,
        page: result.page,
        pageSize: result.pageSize,
        totalCount: result.totalCount,
      });

      return result;
    } catch (error) {
      console.error('❌ [Subscriptions Service] Erreur lors de la récupération des abonnements:', error);
      if (error instanceof Error) {
        console.error('❌ [Subscriptions Service] Détails de l\'erreur:', {
          message: error.message,
          name: error.name,
        });
      }
      throw error;
    }
  },

  /**
   * Crée un abonnement (Admin uniquement)
   */
  createSubscription: async (subscriptionData: CreateSubscriptionRequest): Promise<any> => {
    if (!subscriptionData.userId || !subscriptionData.planId) {
      throw new Error('userId et planId sont requis');
    }

    return subscriptionsApiCall<any>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscriptionData),
    });
  },

  /**
   * Met à jour un abonnement (Admin uniquement)
   */
  updateSubscription: async (id: string, subscriptionData: UpdateSubscriptionRequest): Promise<any> => {
    if (!id) {
      throw new Error('Subscription ID requis');
    }

    return subscriptionsApiCall<any>(`/subscriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subscriptionData),
    });
  },

  /**
   * Supprime un abonnement (Admin uniquement)
   */
  deleteSubscription: async (id: string): Promise<void> => {
    if (!id) {
      throw new Error('Subscription ID requis');
    }

    await subscriptionsApiCall<void>(`/subscriptions/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Vérifie si l'utilisateur connecté a un abonnement actif
   * GET /api/Users/me/has-subscription
   */
  hasActiveSubscription: async (): Promise<boolean> => {
    console.log('🔍 [Subscriptions Service] hasActiveSubscription appelé');

    try {
      const startTime = Date.now();
      const response = await subscriptionsApiCall<{ hasSubscription: boolean }>('/Users/me/has-subscription');
      const duration = Date.now() - startTime;

      const hasSubscription = response?.hasSubscription ?? false;

      console.log('✅ [Subscriptions Service] Vérification abonnement:', {
        duration: duration + 'ms',
        hasSubscription,
        responseType: typeof response,
      });

      return hasSubscription;
    } catch (error) {
      console.error('❌ [Subscriptions Service] Erreur lors de la vérification de l\'abonnement:', error);

      // Si l'erreur est 404 ou 401, considérer qu'il n'y a pas d'abonnement
      if (error instanceof Error && (error.message.includes('404') || error.message.includes('401'))) {
        console.log('ℹ️ [Subscriptions Service] Pas d\'abonnement actif (404/401)');
        return false;
      }

      throw error;
    }
  },

  /**
   * Récupère l'abonnement actif de l'utilisateur connecté
   * GET /api/Users/me/subscription
   */
  getMyActiveSubscription: async (): Promise<any | null> => {
    console.log('🔍 [Subscriptions Service] getMyActiveSubscription appelé');

    try {
      const startTime = Date.now();
      const response = await subscriptionsApiCall<any>('/Users/me/subscription');
      const duration = Date.now() - startTime;

      console.log('✅ [Subscriptions Service] Abonnement récupéré:', {
        duration: duration + 'ms',
        hasSubscription: !!response,
        subscriptionId: response?.id,
        isActive: response?.isActive,
        planName: response?.planCode || response?.plan?.name,
      });

      return response || null;
    } catch (error) {
      console.error('❌ [Subscriptions Service] Erreur lors de la récupération de l\'abonnement:', error);

      // Si l'erreur est 404 ou 401, cela signifie qu'il n'y a pas d'abonnement actif
      if (error instanceof Error && (error.message.includes('404') || error.message.includes('401'))) {
        console.log('ℹ️ [Subscriptions Service] Aucun abonnement actif trouvé (404/401)');
        return null;
      }

      throw error;
    }
  },
};

