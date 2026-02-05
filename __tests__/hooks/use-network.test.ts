/**
 * Tests pour hooks/use-network.ts
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { useNetwork } from '@/hooks/use-network';
import { useNetworkStatus } from '@/contexts/app-context';

jest.mock('@/contexts/app-context');
jest.mock('@/config/api.config', () => ({
  API_CONFIG: {
    BASE_URL: 'https://api.example.com',
  },
}));

describe('useNetwork', () => {
  const mockSetNetworkStatus = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNetworkStatus as jest.Mock).mockReturnValue({
      setNetworkStatus: mockSetNetworkStatus,
    });
    global.fetch = jest.fn();
  });

  it('devrait initialiser avec un état connecté par défaut', () => {
    const { result } = renderHook(() => useNetwork());
    expect(result.current.isConnected).toBe(true);
  });

  it('devrait détecter une connexion active', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    const { result } = renderHook(() => useNetwork());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    expect(mockSetNetworkStatus).toHaveBeenCalledWith('online');
  });

  it('devrait détecter une perte de connexion', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useNetwork());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });

    expect(mockSetNetworkStatus).toHaveBeenCalledWith('offline');
  });

  it('devrait permettre de refetch manuellement', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    const { result } = renderHook(() => useNetwork());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
  });

  it('devrait gérer les timeouts', async () => {
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(() => {}) // Ne résout jamais
    );

    const { result } = renderHook(() => useNetwork());

    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });

    jest.useRealTimers();
  });
});

