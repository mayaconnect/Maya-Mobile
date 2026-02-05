import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAuth, AuthProvider } from '@/hooks/use-auth';
import { AuthService } from '@/services/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AuthService
jest.mock('@/services/auth.service', () => ({
  AuthService: {
    isAuthenticated: jest.fn(),
    getCurrentUserInfo: jest.fn(),
    getAccessToken: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    refreshToken: jest.fn(),
  },
  API_BASE_URL: 'https://api.test.com',
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Wrapper pour le provider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it('devrait initialiser avec un utilisateur null si non connecté', async () => {
    (AuthService.isAuthenticated as jest.Mock).mockResolvedValue(false);
    (AuthService.getCurrentUserInfo as jest.Mock).mockResolvedValue(null);
    (AuthService.getAccessToken as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });

  it('devrait charger un utilisateur depuis l\'API au démarrage si authentifié', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    (AuthService.isAuthenticated as jest.Mock).mockResolvedValue(true);
    (AuthService.getCurrentUserInfo as jest.Mock).mockResolvedValue(mockUser);
    (AuthService.getAccessToken as jest.Mock).mockResolvedValue('token-123');

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it('devrait permettre la connexion', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    (AuthService.isAuthenticated as jest.Mock).mockResolvedValue(false);
    (AuthService.signIn as jest.Mock).mockResolvedValue(mockUser);
    (AuthService.getCurrentUserInfo as jest.Mock).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.signIn({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(AuthService.signIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('devrait permettre la déconnexion', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
    };

    (AuthService.isAuthenticated as jest.Mock).mockResolvedValue(true);
    (AuthService.getCurrentUserInfo as jest.Mock).mockResolvedValue(mockUser);
    (AuthService.signOut as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.signOut();
    });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(AuthService.signOut).toHaveBeenCalled();
    });
  });

  it('devrait rafraîchir les informations utilisateur', async () => {
    const initialUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
    };

    const updatedUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Updated',
      lastName: 'User',
    };

    (AuthService.isAuthenticated as jest.Mock).mockResolvedValue(true);
    (AuthService.getCurrentUserInfo as jest.Mock)
      .mockResolvedValueOnce(initialUser)
      .mockResolvedValueOnce(updatedUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(initialUser);

    await act(async () => {
      await result.current.refreshUser();
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(updatedUser);
    });
  });

  it('devrait gérer les erreurs de connexion', async () => {
    const error = new Error('Invalid credentials');
    (AuthService.isAuthenticated as jest.Mock).mockResolvedValue(false);
    (AuthService.signIn as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await expect(
        result.current.signIn({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow('Invalid credentials');
    });

    expect(result.current.user).toBeNull();
  });
});

