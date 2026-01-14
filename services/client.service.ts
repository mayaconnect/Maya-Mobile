import { API_BASE_URL, AuthService } from './auth.service';

export interface ClientQueryParams {
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ClientListResponse<T = any> {
  items: T[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
}

export interface CreateClientRequest {
  email: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  phoneNumber?: string;
}

export interface UpdateClientRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  phoneNumber?: string;
  isActive?: boolean;
}

const CLIENT_API_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/i, '/api');

const clientApiCall = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = await AuthService.getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${CLIENT_API_BASE_URL}${endpoint}`, {
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

export const ClientService = {
  /**
   * Récupère la liste des clients avec filtres optionnels
   */
  getClients: async (filters: ClientQueryParams = {}): Promise<ClientListResponse> => {
    const params = new URLSearchParams();

    if (filters.email) {
      params.append('email', filters.email);
    }
    if (filters.firstName) {
      params.append('firstName', filters.firstName);
    }
    if (filters.lastName) {
      params.append('lastName', filters.lastName);
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
    const endpoint = `/clients${query ? `?${query}` : ''}`;

    const response = await clientApiCall<any>(endpoint);

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
   * Récupère un client par son ID
   */
  getClientById: async (id: string): Promise<any> => {
    if (!id) {
      throw new Error('Client ID requis');
    }

    return clientApiCall<any>(`/clients/${id}`);
  },

  /**
   * Crée un nouveau client
   */
  createClient: async (clientData: CreateClientRequest): Promise<any> => {
    if (!clientData.email || !clientData.firstName || !clientData.lastName) {
      throw new Error('Email, firstName et lastName sont requis');
    }

    return clientApiCall<any>('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  },

  /**
   * Met à jour un client existant
   */
  updateClient: async (id: string, clientData: UpdateClientRequest): Promise<any> => {
    if (!id) {
      throw new Error('Client ID requis');
    }

    return clientApiCall<any>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clientData),
    });
  },

  /**
   * Supprime un client
   */
  deleteClient: async (id: string): Promise<void> => {
    if (!id) {
      throw new Error('Client ID requis');
    }

    await clientApiCall<void>(`/clients/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Vérifie si l'utilisateur actuel a un abonnement actif
   */
  hasActiveSubscription: async (): Promise<boolean> => {
    const response = await clientApiCall<boolean | { hasSubscription: boolean }>('/clients/me/has-subscription');

    if (typeof response === 'boolean') {
      return response;
    }

    return response?.hasSubscription ?? false;
  },

  /**
   * Récupère l'abonnement actif de l'utilisateur actuel
   */
  getMySubscription: async (): Promise<any> => {
    return clientApiCall<any>('/clients/me/subscription');
  },
};

