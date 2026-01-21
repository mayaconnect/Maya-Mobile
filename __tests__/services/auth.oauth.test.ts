/**
 * Tests pour auth.oauth.ts
 */

import { signInWithGoogle } from '@/services/auth/auth.oauth';
import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCall } from '@/services/shared/api';
import { saveTokens } from '@/services/auth/auth.tokens';

jest.mock('expo-auth-session');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@/services/shared/api');
jest.mock('@/services/auth/auth.tokens');
jest.mock('@/utils/logger', () => ({
  log: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('signInWithGoogle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID = 'test-client-id';
    
    (AuthSession.makeRedirectUri as jest.Mock).mockReturnValue('test-redirect-uri');
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (saveTokens as jest.Mock).mockResolvedValue(undefined);
  });

  it('devrait lancer une erreur si le Client ID n\'est pas configuré', async () => {
    delete process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    
    const mockRequest = {
      promptAsync: jest.fn(),
    };
    
    (AuthSession.AuthRequest as jest.Mock).mockImplementation(() => mockRequest);

    await expect(signInWithGoogle()).rejects.toThrow('Google Client ID non configuré');
  });

  it('devrait lancer une erreur si l\'utilisateur annule', async () => {
    const mockRequest = {
      promptAsync: jest.fn().mockResolvedValue({ type: 'cancel' }),
    };
    
    (AuthSession.AuthRequest as jest.Mock).mockImplementation(() => mockRequest);

    await expect(signInWithGoogle()).rejects.toThrow('Connexion Google annulée');
  });

  it('devrait lancer une erreur si l\'authentification échoue', async () => {
    const mockRequest = {
      promptAsync: jest.fn().mockResolvedValue({
        type: 'error',
        errorCode: 'access_denied',
      }),
    };
    
    (AuthSession.AuthRequest as jest.Mock).mockImplementation(() => mockRequest);

    await expect(signInWithGoogle()).rejects.toThrow('Accès bloqué');
  });

  it('devrait traiter une authentification réussie avec code', async () => {
    const mockCodeVerifier = 'test-code-verifier';
    const mockRequest = {
      codeVerifier: mockCodeVerifier,
      promptAsync: jest.fn().mockResolvedValue({
        type: 'success',
        params: { code: 'test-code' },
      }),
    };
    
    (AuthSession.AuthRequest as jest.Mock).mockImplementation(() => mockRequest);

    // Mock fetch pour l'échange de code
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id_token: 'test-id-token' }),
    });

    // Mock apiCall pour l'appel backend
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    (apiCall as jest.Mock).mockResolvedValue({
      user: mockUser,
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    });

    const result = await signInWithGoogle();

    expect(result).toBeDefined();
    expect(result.email).toBe(mockUser.email);
    expect(apiCall).toHaveBeenCalledWith('/auth/google', expect.any(Object));
    expect(saveTokens).toHaveBeenCalled();
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('devrait traiter une authentification réussie avec id_token direct', async () => {
    const mockRequest = {
      promptAsync: jest.fn().mockResolvedValue({
        type: 'success',
        params: { id_token: 'test-id-token-direct' },
      }),
    };
    
    (AuthSession.AuthRequest as jest.Mock).mockImplementation(() => mockRequest);

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    (apiCall as jest.Mock).mockResolvedValue({
      user: mockUser,
      accessToken: 'test-access-token',
    });

    const result = await signInWithGoogle();

    expect(result).toBeDefined();
    expect(result.email).toBe(mockUser.email);
    expect(apiCall).toHaveBeenCalledWith('/auth/google', expect.objectContaining({
      body: expect.stringContaining('test-id-token-direct'),
    }));
  });

  it('devrait gérer l\'erreur si le code verifier est manquant', async () => {
    const mockRequest = {
      codeVerifier: null,
      promptAsync: jest.fn().mockResolvedValue({
        type: 'success',
        params: { code: 'test-code' },
      }),
    };
    
    (AuthSession.AuthRequest as jest.Mock).mockImplementation(() => mockRequest);

    await expect(signInWithGoogle()).rejects.toThrow('Erreur de configuration PKCE');
  });
});

