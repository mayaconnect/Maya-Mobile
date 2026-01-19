import { API_BASE_URL } from '@/services/auth.service';
import { ApiClient } from '@/services/shared/api-client';
import { log } from '@/utils/logger';

const TRANSACTIONS_API_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/i, '/api');

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

export const TransactionsApi = {
  /**
   * Récupère les transactions d'un partenaire (Partner)
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

    const response = await ApiClient.get<any>(endpoint, {
      baseUrlOverride: TRANSACTIONS_API_BASE_URL,
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
   * Récupère les transactions d'un utilisateur (auth, pagination)
   */
  getUserTransactions: async (
    userId: string,
    filters: TransactionQueryParams = {},
  ): Promise<TransactionListResponse> => {
    if (!userId) {
      throw new Error('User ID requis');
    }

    log.info('Récupération des transactions utilisateur', { userId, filters });

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

    const response = await ApiClient.get<any>(endpoint, {
      baseUrlOverride: TRANSACTIONS_API_BASE_URL,
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

    const response = await ApiClient.get<number | { count: number }>(endpoint, {
      baseUrlOverride: TRANSACTIONS_API_BASE_URL,
    });

    if (typeof response === 'number') {
      return response;
    }

    return response?.count ?? 0;
  },

  /**
   * Récupère le nombre de scans pour un partenaire (Partner)
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

    const response = await ApiClient.get<string | number | { count: number }>(endpoint, {
      baseUrlOverride: TRANSACTIONS_API_BASE_URL,
    });

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

    const response = await ApiClient.get<any>(endpoint, {
      baseUrlOverride: TRANSACTIONS_API_BASE_URL,
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
   * Récupère les économies d'un utilisateur par période (auth)
   */
  getUserSavings: async (userId: string, period: SavingsPeriod): Promise<number> => {
    if (!userId) {
      throw new Error('User ID requis');
    }
    if (!['day', 'week', 'month', 'year'].includes(period)) {
      throw new Error('Période invalide. Doit être: day, week, month, ou year');
    }

    const response = await ApiClient.get<number | { savings: number; total: number }>(
      `/transactions/user/${userId}/savings/${period}`,
      {
        baseUrlOverride: TRANSACTIONS_API_BASE_URL,
      }
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

    const response = await ApiClient.get<any>(
      `/transactions/user/${userId}/savings/by-category`,
      {
        baseUrlOverride: TRANSACTIONS_API_BASE_URL,
      }
    );

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
          log.error('Erreur lors du parsing de data', e as Error);
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

