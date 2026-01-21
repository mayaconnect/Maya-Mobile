import { API_BASE_URL, AuthService } from '@/services/auth.service';
import { ApiClient } from '@/services/shared/api-client';
import { UserProfile } from '../types';

const CLIENT_API_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/i, '/api');

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

export const ProfileApi = {
  /**
   * Récupère le profil de l'utilisateur actuel
   */
  getCurrentUser: async (): Promise<UserProfile> => {
    try {
      const user = await AuthService.getCurrentUserInfo();
      return user as UserProfile;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      throw error;
    }
  },

  /**
   * Récupère un client par son ID
   */
  getClientById: async (id: string): Promise<UserProfile> => {
    if (!id) {
      throw new Error('Client ID requis');
    }

    return ApiClient.get<UserProfile>(`/clients/${id}`, {
      baseUrlOverride: CLIENT_API_BASE_URL,
    });
  },

  /**
   * Met à jour le profil d'un utilisateur
   */
  updateProfile: async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
    if (!userId) {
      throw new Error('User ID requis');
    }

    return ApiClient.put<UserProfile>(`/clients/${userId}`, updates as UpdateClientRequest, {
      baseUrlOverride: CLIENT_API_BASE_URL,
    });
  },

  /**
   * Vérifie si l'utilisateur actuel a un abonnement actif
   */
  hasActiveSubscription: async (): Promise<boolean> => {
    const response = await ApiClient.get<boolean | { hasSubscription: boolean }>(
      '/clients/me/has-subscription',
      {
        baseUrlOverride: CLIENT_API_BASE_URL,
      }
    );

    if (typeof response === 'boolean') {
      return response;
    }

    return response?.hasSubscription ?? false;
  },

  /**
   * Récupère l'abonnement actif de l'utilisateur actuel
   */
  getMySubscription: async (): Promise<any> => {
    return ApiClient.get<any>('/clients/me/subscription', {
      baseUrlOverride: CLIENT_API_BASE_URL,
    });
  },
};

