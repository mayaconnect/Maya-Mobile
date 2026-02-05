/**
 * Tests pour services/auth/auth.login.ts
 */

import { signIn, signUp } from '@/services/auth/auth.login';
import { apiCall } from '@/services/shared/api';
import { saveTokens } from '@/services/auth/auth.tokens';

jest.mock('@/services/shared/api');
jest.mock('@/services/auth/auth.tokens');
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('auth.login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('devrait connecter un utilisateur avec succès', async () => {
      const mockResponse = {
        user: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
        },
        accessToken: 'token-123',
        refreshToken: 'refresh-123',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      };

      (apiCall as jest.Mock).mockResolvedValue(mockResponse);

      const result = await signIn({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.email).toBe('test@example.com');
      expect(result.firstName).toBe('John');
      expect(saveTokens).toHaveBeenCalled();
    });

    it('devrait gérer les réponses avec data au lieu de user', async () => {
      const mockResponse = {
        data: {
          id: '1',
          firstName: 'Jane',
          lastName: 'Doe',
        },
        accessToken: 'token-123',
      };

      (apiCall as jest.Mock).mockResolvedValue(mockResponse);

      const result = await signIn({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.firstName).toBe('Jane');
    });

    it('devrait gérer les erreurs de connexion', async () => {
      (apiCall as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

      await expect(
        signIn({
          email: 'test@example.com',
          password: 'wrong',
        })
      ).rejects.toThrow();
    });
  });

  describe('signUp', () => {
    it('devrait inscrire un nouvel utilisateur', async () => {
      const mockResponse = {
        user: {
          id: '1',
          firstName: 'New',
          lastName: 'User',
          email: 'new@example.com',
        },
        accessToken: 'token-123',
      };

      (apiCall as jest.Mock).mockResolvedValue(mockResponse);

      const result = await signUp({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      });

      expect(result.email).toBe('new@example.com');
      expect(saveTokens).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs d\'inscription', async () => {
      (apiCall as jest.Mock).mockRejectedValue(new Error('Email already exists'));

      await expect(
        signUp({
          email: 'existing@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        })
      ).rejects.toThrow();
    });
  });
});

