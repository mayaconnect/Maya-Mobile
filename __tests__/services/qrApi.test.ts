/**
 * Tests pour QrApi
 */

import { QrApi } from '@/features/home/services/qrApi';
import { ApiClient } from '@/services/shared/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@/services/shared/api-client');
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('QrApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('issueQrToken', () => {
    it('devrait générer un nouveau token QR', async () => {
      const mockToken = {
        token: 'test-token-123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      };

      (ApiClient.post as jest.Mock).mockResolvedValue(mockToken);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await QrApi.issueQrToken();

      expect(result.token).toBe('test-token-123');
      expect(ApiClient.post).toHaveBeenCalled();
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('devrait utiliser le token en cache s\'il est valide', async () => {
      const cachedToken = {
        token: 'cached-token',
        expiresAt: new Date(Date.now() + 600000).toISOString(), // 10 minutes
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cachedToken));

      const result = await QrApi.issueQrToken(false);

      expect(result.token).toBe('cached-token');
      expect(ApiClient.post).not.toHaveBeenCalled();
    });
  });

  describe('validateQrToken', () => {
    it('devrait valider un token QR', async () => {
      const mockResponse = { success: true };

      (ApiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await QrApi.validateQrToken(
        'test-token',
        'partner-id',
        'store-id',
        'operator-id'
      );

      expect(result).toEqual(mockResponse);
      expect(ApiClient.post).toHaveBeenCalled();
    });

    it('devrait lancer une erreur si le token est manquant', async () => {
      await expect(
        QrApi.validateQrToken('', 'partner-id', 'store-id', 'operator-id')
      ).rejects.toThrow('Token QR requis');
    });
  });
});

