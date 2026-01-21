/**
 * Tests pour auth.password-reset
 */

import {
  requestPasswordReset,
  requestPasswordResetCode,
  verifyPasswordResetCode,
  resetPassword,
} from '@/services/auth/auth.password-reset';
import { ApiClient } from '@/services/shared/api-client';

jest.mock('@/services/shared/api-client');
jest.mock('@/services/auth/auth.config', () => ({
  API_BASE_URL: 'https://api.example.com/api/v1',
}));

describe('auth.password-reset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestPasswordReset', () => {
    it('devrait demander une réinitialisation de mot de passe', async () => {
      (ApiClient.post as jest.Mock).mockResolvedValue({});

      await requestPasswordReset('test@example.com');

      expect(ApiClient.post).toHaveBeenCalledWith(
        '/auth/request-password-reset',
        { email: 'test@example.com' }
      );
    });

    it('devrait lancer une erreur appropriée pour une erreur serveur', async () => {
      (ApiClient.post as jest.Mock).mockRejectedValue(new Error('HTTP 500: Server Error'));

      await expect(requestPasswordReset('test@example.com')).rejects.toThrow(
        'Erreur serveur. Veuillez réessayer plus tard.'
      );
    });

    it('devrait lancer une erreur appropriée pour un email inconnu', async () => {
      (apiCall as jest.Mock).mockRejectedValue(new Error('HTTP 404: Not Found'));

      await expect(requestPasswordReset('unknown@example.com')).rejects.toThrow(
        'Adresse email inconnue'
      );
    });
  });

  describe('requestPasswordResetCode', () => {
    it('devrait demander un code de réinitialisation par email', async () => {
      (ApiClient.post as jest.Mock).mockResolvedValue({});

      await requestPasswordResetCode('test@example.com', undefined, 'email');

      expect(ApiClient.post).toHaveBeenCalledWith(
        '/auth/request-password-reset-code',
        {
          email: 'test@example.com',
          channel: 'email',
        }
      );
    });

    it('devrait inclure le numéro de téléphone si fourni', async () => {
      (ApiClient.post as jest.Mock).mockResolvedValue({});

      await requestPasswordResetCode('test@example.com', '+33123456789', 'sms');

      expect(ApiClient.post).toHaveBeenCalledWith(
        '/auth/request-password-reset-code',
        {
          email: 'test@example.com',
          phoneNumber: '+33123456789',
          channel: 'sms',
        }
      );
    });
  });

  describe('verifyPasswordResetCode', () => {
    it('devrait vérifier un code de réinitialisation', async () => {
      const mockResponse = { token: 'reset-token' };
      (apiCall as jest.Mock).mockResolvedValue(mockResponse);

      const result = await verifyPasswordResetCode('test@example.com', '123456');

      expect(result).toBe('reset-token');
      expect(ApiClient.post).toHaveBeenCalledWith(
        '/auth/verify-password-reset-code',
        { email: 'test@example.com', code: '123456' }
      );
    });

    it('devrait retourner undefined si aucun token n\'est retourné', async () => {
      (ApiClient.post as jest.Mock).mockResolvedValue({});

      const result = await verifyPasswordResetCode('test@example.com', '123456');

      expect(result).toBeUndefined();
    });
  });

  describe('resetPassword', () => {
    it('devrait réinitialiser le mot de passe', async () => {
      (ApiClient.post as jest.Mock).mockResolvedValue({});

      await resetPassword('reset-token', 'newPassword123');

      expect(ApiClient.post).toHaveBeenCalledWith(
        '/auth/reset-password',
        {
          token: 'reset-token',
          newPassword: 'newPassword123',
        }
      );
    });
  });
});

