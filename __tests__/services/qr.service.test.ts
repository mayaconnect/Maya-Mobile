import { AuthService } from '@/services/auth.service';
import { QrService } from '@/services/qr.service';
import { apiCall } from '@/services/shared/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('@/services/auth.service', () => ({
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://fc554a95db2c.ngrok-free.app/api/v1',
  AuthService: {
    getAccessToken: jest.fn(),
  },
}));
jest.mock('@/services/shared/api');

describe('QrService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AuthService.getAccessToken as jest.Mock).mockResolvedValue('test-token');
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('issueQrToken', () => {
    it('generates new QR token successfully', async () => {
      const mockResponse = {
        token: 'qr_token_123',
        expiresAt: new Date(Date.now() + 300000).toISOString(),
      };

      (apiCall as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await QrService.issueQrToken();

      expect(result.token).toBe('qr_token_123');
      expect(result.expiresAt).toBe(mockResponse.expiresAt);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('returns cached token if still valid', async () => {
      const cachedToken = {
        token: 'cached_token',
        expiresAt: new Date(Date.now() + 120000).toISOString(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedToken));

      const result = await QrService.issueQrToken();

      expect(result.token).toBe('cached_token');
      expect(apiCall).not.toHaveBeenCalled();
    });

    it('forces refresh when forceRefresh is true', async () => {
      const cachedToken = {
        token: 'cached_token',
        expiresAt: new Date(Date.now() + 120000).toISOString(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedToken));

      const mockResponse = {
        token: 'new_token',
        expiresAt: new Date(Date.now() + 300000).toISOString(),
      };

      (apiCall as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await QrService.issueQrToken(true);

      expect(result.token).toBe('new_token');
      expect(apiCall).toHaveBeenCalled();
    });

    it('handles fallback token on 403 error', async () => {
      const error = new Error('HTTP 403: Forbidden');
      (apiCall as jest.Mock).mockRejectedValueOnce(error);

      const result = await QrService.issueQrToken();

      expect(result.token).toMatch(/^local-/);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('handles string response', async () => {
      (apiCall as jest.Mock).mockResolvedValueOnce('{"token":"string_token","expiresAt":"2024-12-31"}');

      const result = await QrService.issueQrToken();

      expect(result.token).toBe('string_token');
    });

    it('throws error when token is missing in response', async () => {
      (apiCall as jest.Mock).mockResolvedValueOnce({ expiresAt: '2024-12-31' });

      await expect(QrService.issueQrToken()).rejects.toThrow('Réponse invalide');
    });
  });

  describe('getStoredQrToken', () => {
    it('returns stored token if valid', async () => {
      const storedToken = {
        token: 'stored_token',
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(storedToken));

      const result = await QrService.getStoredQrToken();

      expect(result).toEqual(storedToken);
    });

    it('returns null if no token stored', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await QrService.getStoredQrToken();

      expect(result).toBeNull();
    });

    it('removes expired token from storage', async () => {
      const expiredToken = {
        token: 'expired_token',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(expiredToken));

      const result = await QrService.getStoredQrToken();

      expect(result).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('clearStoredQrToken', () => {
    it('removes token from storage', async () => {
      await QrService.clearStoredQrToken();

      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('validateQrToken', () => {
    it('validates QR token successfully', async () => {
      const mockResponse = { valid: true, partnerId: 'partner1' };

      (apiCall as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await QrService.validateQrToken('qr_token_123');

      expect(apiCall).toHaveBeenCalledWith(
        expect.stringContaining('/qr/validate'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('qr_token_123'),
        }),
        0,
        expect.any(String)
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws error when token is missing', async () => {
      await expect(QrService.validateQrToken('')).rejects.toThrow('Token QR requis');
    });
  });
});

