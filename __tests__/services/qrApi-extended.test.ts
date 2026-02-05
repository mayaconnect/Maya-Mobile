/**
 * Tests supplémentaires pour features/home/services/qrApi.ts
 */

import { QrApi } from '@/features/home/services/qrApi';
import { ApiClient } from '@/services/shared/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@/services/shared/api-client');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@/services/auth.service', () => ({
  API_BASE_URL: 'https://api.example.com/api/v1',
}));

describe('QrApi - Tests étendus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('issueQrToken', () => {
    it('devrait utiliser le token en cache s\'il est valide', async () => {
      const cachedToken = {
        token: 'cached-token',
        expiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cachedToken));

      const result = await QrApi.issueQrToken(false);

      expect(result).toEqual(cachedToken);
      expect(ApiClient.post).not.toHaveBeenCalled();
    });

    it('devrait forcer le refresh si forceRefresh est true', async () => {
      const cachedToken = {
        token: 'cached-token',
        expiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cachedToken));
      const newToken = {
        token: 'new-token',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      };
      (ApiClient.post as jest.Mock).mockResolvedValue(newToken);

      const result = await QrApi.issueQrToken(true);

      expect(result).toEqual(newToken);
      expect(ApiClient.post).toHaveBeenCalled();
    });

    it('devrait générer un nouveau token si le cache est expiré', async () => {
      const expiredToken = {
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(expiredToken));
      const newToken = {
        token: 'new-token',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      };
      (ApiClient.post as jest.Mock).mockResolvedValue(newToken);

      const result = await QrApi.issueQrToken(false);

      expect(result).toEqual(newToken);
      expect(ApiClient.post).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs 403 avec un fallback', async () => {
      const error = new Error('HTTP 403');
      error.message = 'HTTP 403';
      (ApiClient.post as jest.Mock).mockRejectedValue(error);

      const result = await QrApi.issueQrToken(true);

      expect(result.token).toContain('local-');
      expect(result.expiresAt).toBeDefined();
    });
  });
});

