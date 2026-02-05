/**
 * Tests supplémentaires pour services/auth/auth.password-reset.ts
 */

import {
  requestPasswordReset,
  requestPasswordResetCode,
  verifyPasswordResetCode,
  resetPassword,
} from '@/services/auth/auth.password-reset';
import { ApiClient } from '@/services/shared/api-client';

jest.mock('@/services/shared/api-client');

describe('auth.password-reset - Tests étendus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestPasswordReset', () => {
    it('devrait envoyer une demande de réinitialisation', async () => {
      (ApiClient.post as jest.Mock).mockResolvedValue({});

      await requestPasswordReset('test@example.com');

      expect(ApiClient.post).toHaveBeenCalledWith(
        '/auth/request-password-reset',
        { email: 'test@example.com' }
      );
    });

    it('devrait gérer les erreurs 500', async () => {
      const error = new Error('HTTP 500 Server Error');
      (ApiClient.post as jest.Mock).mockRejectedValue(error);

      await expect(requestPasswordReset('test@example.com')).rejects.toThrow(
        'Erreur serveur'
      );
    });

    it('devrait gérer les erreurs 404', async () => {
      const error = new Error('HTTP 404 Not Found');
      (ApiClient.post as jest.Mock).mockRejectedValue(error);

      await expect(requestPasswordReset('test@example.com')).rejects.toThrow(
        'Adresse email inconnue'
      );
    });

    it('devrait gérer les timeouts', async () => {
      const error = new Error('TIMEOUT_ERROR');
      (ApiClient.post as jest.Mock).mockRejectedValue(error);

      await expect(requestPasswordReset('test@example.com')).rejects.toThrow(
        'trop de temps'
      );
    });
  });

  describe('requestPasswordResetCode', () => {
    it('devrait envoyer un code par email', async () => {
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

    it('devrait envoyer un code par SMS avec numéro de téléphone', async () => {
      (ApiClient.post as jest.Mock).mockResolvedValue({});

      await requestPasswordResetCode('test@example.com', '0123456789', 'sms');

      expect(ApiClient.post).toHaveBeenCalledWith(
        '/auth/request-password-reset-code',
        {
          email: 'test@example.com',
          phoneNumber: '0123456789',
          channel: 'sms',
        }
      );
    });
  });

  describe('verifyPasswordResetCode', () => {
    it('devrait vérifier un code valide', async () => {
      (ApiClient.post as jest.Mock).mockResolvedValue({ valid: true });

      const result = await verifyPasswordResetCode('test@example.com', '123456');

      expect(result).toBe(true);
      expect(ApiClient.post).toHaveBeenCalledWith(
        '/auth/verify-password-reset-code',
        {
          email: 'test@example.com',
          code: '123456',
        }
      );
    });

    it('devrait rejeter un code invalide', async () => {
      (ApiClient.post as jest.Mock).mockResolvedValue({ valid: false });

      const result = await verifyPasswordResetCode('test@example.com', '000000');

      expect(result).toBe(false);
    });
  });

  describe('resetPassword', () => {
    it('devrait réinitialiser le mot de passe', async () => {
      (ApiClient.post as jest.Mock).mockResolvedValue({ success: true });

      await resetPassword('test@example.com', 'newPassword123', '123456');

      expect(ApiClient.post).toHaveBeenCalledWith(
        '/auth/reset-password',
        {
          email: 'test@example.com',
          newPassword: 'newPassword123',
          code: '123456',
        }
      );
    });
  });
});

