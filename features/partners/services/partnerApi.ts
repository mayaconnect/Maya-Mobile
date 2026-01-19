import { API_BASE_URL } from '@/services/auth.service';
import { ApiClient } from '@/services/shared/api-client';
import { PartnerListResponse, PartnerQueryParams } from '../types';

const PARTNER_API_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/i, '/api');

export const PartnerApi = {
  /**
   * Récupère la liste des partenaires avec filtres optionnels
   */
  getPartners: async (filters: PartnerQueryParams = {}): Promise<PartnerListResponse> => {
    const params = new URLSearchParams();

    if (filters.name) {
      params.append('name', filters.name);
    }
    if (filters.email) {
      params.append('email', filters.email);
    }
    if (typeof filters.isActive === 'boolean') {
      params.append('isActive', String(filters.isActive));
    }
    if (filters.page) {
      params.append('page', String(filters.page));
    }
    if (filters.pageSize) {
      params.append('pageSize', String(filters.pageSize));
    }

    const query = params.toString();
    const endpoint = `/partners${query ? `?${query}` : ''}`;

    const response = await ApiClient.get<any>(endpoint, {
      baseUrlOverride: PARTNER_API_BASE_URL,
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

    if (response?.data && Array.isArray(response.data)) {
      return {
        items: response.data,
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
   * Récupère un partenaire par son ID
   */
  getPartnerById: async (id: string): Promise<any> => {
    if (!id) {
      throw new Error('Partner ID requis');
    }

    return ApiClient.get<any>(`/partners/${id}`, {
      baseUrlOverride: PARTNER_API_BASE_URL,
    });
  },
};

