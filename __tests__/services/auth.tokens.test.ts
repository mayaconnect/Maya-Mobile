/**
 * Tests pour auth.tokens
 */

import { saveTokens, getTokens, clearTokens, isTokenValid } from '@/services/auth/auth.tokens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TokenData } from '@/services/auth/auth.types';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('auth.tokens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveTokens', () => {
    it('devrait sauvegarder les tokens dans AsyncStorage', async () => {
      const tokens: TokenData = {
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        userId: 'user-1',
      };

      await saveTokens(tokens);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@maya_tokens',
        JSON.stringify(tokens)
      );
    });
  });

  describe('getTokens', () => {
    it('devrait récupérer les tokens depuis AsyncStorage', async () => {
      const tokens: TokenData = {
        accessToken: 'test-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        userId: 'user-1',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(tokens));

      const result = await getTokens();

      expect(result).toEqual(tokens);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@maya_tokens');
    });

    it('devrait retourner null si aucun token n\'est stocké', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await getTokens();

      expect(result).toBeNull();
    });
  });

  describe('clearTokens', () => {
    it('devrait supprimer les tokens du stockage', async () => {
      await clearTokens();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@maya_tokens');
    });
  });

  describe('isTokenValid', () => {
    it('devrait retourner true si le token est valide', () => {
      const tokens: TokenData = {
        accessToken: 'test-token',
        expiresAt: new Date(Date.now() + 600000).toISOString(), // 10 minutes
        userId: 'user-1',
      };

      expect(isTokenValid(tokens)).toBe(true);
    });

    it('devrait retourner false si le token est expiré', () => {
      const tokens: TokenData = {
        accessToken: 'test-token',
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expiré
        userId: 'user-1',
      };

      expect(isTokenValid(tokens)).toBe(false);
    });

    it('devrait retourner false si le token est null', () => {
      expect(isTokenValid(null)).toBe(false);
    });

    it('devrait retourner false si expiresAt est manquant', () => {
      const tokens = {
        accessToken: 'test-token',
        userId: 'user-1',
      } as TokenData;

      expect(isTokenValid(tokens)).toBe(false);
    });
  });
});

