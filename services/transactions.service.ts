import { API_BASE_URL, AuthService } from './auth.service';
import { apiCall } from './shared/api';

const TRANSACTIONS_API_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/i, '/api');

const transactionsApiCall = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  try {
    const token = await AuthService.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Passer les headers dans les options
    const finalOptions: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        ...headers,
      },
    };

    return await apiCall<T>(endpoint, finalOptions, 0, TRANSACTIONS_API_BASE_URL);
  } catch (error) {
    // Si erreur 401, essayer de rafraîchir le token
    if (error instanceof Error && error.message.includes('401')) {
      console.log('🔄 [Transactions] Token expiré, tentative de rafraîchissement...');
      try {
        // Essayer de rafraîchir le token
        const refreshedToken = await AuthService.getAccessToken();
        if (refreshedToken) {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${refreshedToken}`,
            ...(options.headers as Record<string, string> | undefined),
          };
          const retryOptions: RequestInit = {
            ...options,
            headers: {
              ...options.headers,
              ...headers,
            },
          };
          return await apiCall<T>(endpoint, retryOptions, 0, TRANSACTIONS_API_BASE_URL);
        }
      } catch (refreshError) {
        console.error('❌ [Transactions] Impossible de rafraîchir le token:', refreshError);
      }
    }
    throw error;
  }
};

export interface TransactionQueryParams {
  page?: number;
  pageSize?: number;
  storeId?: string;
  startDate?: string;
  endDate?: string;
}

export interface TransactionListResponse<T = any> {
  items: T[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
}

export type SavingsPeriod = 'day' | 'week' | 'month' | 'year';

export interface SavingsByCategoryResponse {
  category: string;
  totalSavings: number;
  transactionCount: number;
}

export const TransactionsService = {
  /**
   * Récupère les transactions d'un partenaire (Partner)
   * Optionnel: storeId, pagination
   */
  getPartnerTransactions: async (
    partnerId: string,
    filters: TransactionQueryParams = {},
  ): Promise<TransactionListResponse> => {
    if (!partnerId) {
      throw new Error('Partner ID requis');
    }

    const params = new URLSearchParams();

    if (filters.page) {
      params.append('page', String(filters.page));
    }
    if (filters.pageSize) {
      params.append('pageSize', String(filters.pageSize));
    }
    if (filters.storeId) {
      params.append('storeId', filters.storeId);
    }
    if (filters.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate);
    }

    const query = params.toString();
    const endpoint = `/transactions/partner/${partnerId}${query ? `?${query}` : ''}`;

    const response = await transactionsApiCall<any>(endpoint);

    if (Array.isArray(response)) {
      return {
        items: response,
        page: filters.page,
        pageSize: filters.pageSize ?? response.length,
        totalCount: response.length,
      };
    }

    if (response?.items && Array.isArray(response.items)) {
      return {
        items: response.items,
        page: response.page ?? filters.page,
        pageSize: response.pageSize ?? filters.pageSize,
        totalCount: response.totalCount ?? response.total ?? response.count,
      };
    }

    return {
      items: [],
      page: filters.page,
      pageSize: filters.pageSize,
      totalCount: 0,
    };
  },

  /**
   * Récupère les transactions d'un utilisateur (auth, pagination)
   */
  getUserTransactions: async (
    userId: string,
    filters: TransactionQueryParams = {},
  ): Promise<TransactionListResponse> => {
    if (!userId) {
      throw new Error('User ID requis');
    }

    console.log('📊 [Transactions Service] getUserTransactions appelé:', {
      userId,
      userIdLength: userId.length,
      filters,
    });

    const params = new URLSearchParams();

    if (filters.page) {
      params.append('page', String(filters.page));
    }
    if (filters.pageSize) {
      params.append('pageSize', String(filters.pageSize));
    }
    if (filters.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate);
    }

    const query = params.toString();
    const endpoint = `/transactions/user/${userId}${query ? `?${query}` : ''}`;

    console.log('🌐 [Transactions Service] Appel API:', endpoint);

    const response = await transactionsApiCall<any>(endpoint);
    
    console.log('✅ [Transactions Service] Réponse reçue:', {
      isArray: Array.isArray(response),
      hasItems: !!response?.items,
      itemsCount: Array.isArray(response) ? response.length : response?.items?.length || 0,
    });

    if (Array.isArray(response)) {
      return {
        items: response,
        page: filters.page,
        pageSize: filters.pageSize ?? response.length,
        totalCount: response.length,
      };
    }

    if (response?.items && Array.isArray(response.items)) {
      return {
        items: response.items,
        page: response.page ?? filters.page,
        pageSize: response.pageSize ?? filters.pageSize,
        totalCount: response.totalCount ?? response.total ?? response.count,
      };
    }

    return {
      items: [],
      page: filters.page,
      pageSize: filters.pageSize,
      totalCount: 0,
    };
  },

  /**
   * Compte les scans pour un magasin depuis une date optionnelle (Partner)
   */
  getStoreScanCount: async (storeId: string, sinceDate?: string): Promise<number> => {
    if (!storeId) {
      throw new Error('Store ID requis');
    }

    const params = new URLSearchParams();
    if (sinceDate) {
      params.append('sinceDate', sinceDate);
    }

    const query = params.toString();
    const endpoint = `/transactions/store/${storeId}/scancount${query ? `?${query}` : ''}`;

    const response = await transactionsApiCall<number | { count: number }>(endpoint);

    if (typeof response === 'number') {
      return response;
    }

    return response?.count ?? 0;
  },

  /**
   * Récupère le nombre de scans pour un partenaire (Partner)
   * Optionnel: storeId, since (date de début), until (date de fin)
   */
  getScanCount: async (
    partnerId?: string,
    storeId?: string,
    since?: string,
    until?: string
  ): Promise<string> => {
    const params = new URLSearchParams();

    if (partnerId) {
      params.append('partnerId', partnerId);
    }
    if (storeId) {
      params.append('storeId', storeId);
    }
    if (since) {
      params.append('since', since);
    }
    if (until) {
      params.append('until', until);
    }

    const query = params.toString();
    const endpoint = `/transactions/scancount${query ? `?${query}` : ''}`;

    const response = await transactionsApiCall<string | number | { count: number }>(endpoint);

    if (typeof response === 'string') {
      return response;
    }

    if (typeof response === 'number') {
      return String(response);
    }

    if (typeof response === 'object' && 'count' in response) {
      return String(response.count);
    }

    return '0';
  },

  /**
   * Récupère les transactions filtrées avec détails (scans détaillés)
   * Optionnel: partnerId, storeId, operatorUserId, customerUserId, since, until, page, pageSize
   */
  getFilteredTransactions: async (filters: {
    partnerId?: string;
    storeId?: string;
    operatorUserId?: string;
    customerUserId?: string;
    subscriptionId?: string;
    planId?: string;
    since?: string;
    until?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<TransactionListResponse> => {
    const params = new URLSearchParams();

    if (filters.partnerId) {
      params.append('partnerId', filters.partnerId);
    }
    if (filters.storeId) {
      params.append('storeId', filters.storeId);
    }
    if (filters.operatorUserId) {
      params.append('operatorUserId', filters.operatorUserId);
    }
    if (filters.customerUserId) {
      params.append('customerUserId', filters.customerUserId);
    }
    if (filters.subscriptionId) {
      params.append('subscriptionId', filters.subscriptionId);
    }
    if (filters.planId) {
      params.append('planId', filters.planId);
    }
    if (filters.since) {
      params.append('since', filters.since);
    }
    if (filters.until) {
      params.append('until', filters.until);
    }
    if (filters.page) {
      params.append('page', String(filters.page));
    }
    if (filters.pageSize) {
      params.append('pageSize', String(filters.pageSize));
    }

    const query = params.toString();
    const endpoint = `/transactions/filtered${query ? `?${query}` : ''}`;

    const response = await transactionsApiCall<any>(endpoint);

    if (Array.isArray(response)) {
      return {
        items: response,
        page: filters.page,
        pageSize: filters.pageSize ?? response.length,
        totalCount: response.length,
      };
    }

    if (response?.items && Array.isArray(response.items)) {
      return {
        items: response.items,
        page: response.page ?? filters.page,
        pageSize: response.pageSize ?? filters.pageSize,
        totalCount: response.totalCount ?? response.total ?? response.count,
      };
    }

    return {
      items: [],
      page: filters.page,
      pageSize: filters.pageSize,
      totalCount: 0,
    };
  },

  /**
   * Récupère les économies d'un utilisateur par période (auth)
   * Période: day|week|month|year
   */
  getUserSavings: async (userId: string, period: SavingsPeriod): Promise<number> => {
    if (!userId) {
      throw new Error('User ID requis');
    }
    if (!['day', 'week', 'month', 'year'].includes(period)) {
      throw new Error('Période invalide. Doit être: day, week, month, ou year');
    }

    const response = await transactionsApiCall<number | { savings: number; total: number }>(
      `/transactions/user/${userId}/savings/${period}`,
    );

    if (typeof response === 'number') {
      return response;
    }

    return response?.savings ?? response?.total ?? 0;
  },

  /**
   * Récupère les économies d'un utilisateur groupées par catégorie de partenaire (auth)
   */
  getUserSavingsByCategory: async (userId: string): Promise<SavingsByCategoryResponse[]> => {
    if (!userId) {
      throw new Error('User ID requis');
    }

    const response = await transactionsApiCall<any>(
      `/transactions/user/${userId}/savings/by-category`,
    );

    console.log('📊 [Transactions Service] Réponse brute getUserSavingsByCategory:', response);

    // Si la réponse est un tableau direct
    if (Array.isArray(response)) {
      return response.map(item => ({
        category: item.category || 'Autre',
        totalSavings: item.totalSavings || item.amount || 0,
        transactionCount: item.transactionCount || 0,
      }));
    }

    // Si la réponse a une propriété data
    if (response?.data) {
      let data = response.data;

      // Si data est une chaîne JSON, la parser
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error('❌ [Transactions Service] Erreur lors du parsing de data:', e);
          return [];
        }
      }

      // Si data est maintenant un tableau
      if (Array.isArray(data)) {
        return data.map(item => ({
          category: item.category || 'Autre',
          totalSavings: item.totalSavings || item.amount || 0,
          transactionCount: item.transactionCount || 0,
        }));
      }
    }

    return [];
  },
};

