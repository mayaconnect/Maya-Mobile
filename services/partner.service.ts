import { API_BASE_URL, AuthService } from './auth.service';

export interface PartnerQueryParams {
  name?: string;
  email?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PartnerListResponse<T = any> {
  items: T[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
}

const PARTNER_API_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/i, '/api');

const partnerApiCall = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = await AuthService.getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${PARTNER_API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
};

export const PartnerService = {
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

    const response = await partnerApiCall<any>(endpoint);

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

  getPartnerById: async (id: string): Promise<any> => {
    if (!id) {
      throw new Error('Partner ID requis');
    }

    return partnerApiCall<any>(`/partners/${id}`);
  },
};

