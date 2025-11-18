import { API_BASE_URL, AuthService } from './auth.service';
import { apiCall } from './shared/api';

const PROFILES_API_BASE_URL = API_BASE_URL;

const profilesApiCall = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = await AuthService.getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return apiCall<T>(endpoint, options, 0, PROFILES_API_BASE_URL);
};

export const ProfilesService = {
  /**
   * Crée un profil (placeholder, retourne 501)
   */
  createProfile: async (): Promise<any> => {
    return profilesApiCall<any>('/profiles', {
      method: 'POST',
    });
  },
};

