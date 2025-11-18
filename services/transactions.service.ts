import { API_BASE_URL, AuthService } from './auth.service';
import { apiCall } from './shared/api';

const TRANSACTIONS_API_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/i, '/api');

const transactionsApiCall = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = await AuthService.getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return apiCall<T>(endpoint, options, 0, TRANSACTIONS_API_BASE_URL);
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

    const response = await transactionsApiCall<SavingsByCategoryResponse[] | { data: SavingsByCategoryResponse[] }>(
      `/transactions/user/${userId}/savings/by-category`,
    );

    if (Array.isArray(response)) {
      return response;
    }

    return response?.data ?? [];
  },
};

