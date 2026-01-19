import { AuthService } from '@/services/auth.service';
import { apiCall } from '@/services/shared/api';
import { StoresService } from '@/services/stores.service';

jest.mock('@/services/auth.service', () => ({
  API_BASE_URL: 'https://fc554a95db2c.ngrok-free.app/api/v1',
  AuthService: {
    getAccessToken: jest.fn(),
  },
}));

jest.mock('@/services/shared/api');

describe('StoresService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AuthService.getAccessToken as jest.Mock).mockResolvedValue('test-token');
  });

  describe('getMyStores', () => {
    it('fetches user stores successfully', async () => {
      const mockStores = [
        { id: '1', name: 'Store 1' },
        { id: '2', name: 'Store 2' },
      ];

      (apiCall as jest.Mock).mockResolvedValueOnce(mockStores);

      const result = await StoresService.getMyStores();

      expect(apiCall).toHaveBeenCalledWith('/stores/me', expect.any(Object), 0, expect.any(String));
      expect(result.items).toEqual(mockStores);
      expect(result.totalCount).toBe(2);
    });

    it('handles response with items property', async () => {
      const mockResponse = {
        items: [{ id: '1', name: 'Store 1' }],
        page: 1,
        pageSize: 10,
        totalCount: 1,
      };

      (apiCall as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await StoresService.getMyStores();

      expect(result.items).toEqual(mockResponse.items);
      expect(result.totalCount).toBe(1);
    });

    it('returns empty array on error', async () => {
      (apiCall as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      await expect(StoresService.getMyStores()).rejects.toThrow('API Error');
    });
  });

  describe('searchStores', () => {
    it('searches stores with parameters', async () => {
      const searchParams = {
        latitude: 48.8566,
        longitude: 2.3522,
        radiusKm: 10,
        page: 1,
        pageSize: 20,
      };

      const mockResponse = {
        items: [{ id: '1', name: 'Store 1' }],
        page: 1,
        pageSize: 20,
        totalCount: 1,
      };

      (apiCall as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await StoresService.searchStores(searchParams);

      expect(apiCall).toHaveBeenCalledWith(
        '/stores/search',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(searchParams),
        }),
        0,
        expect.any(String)
      );
      expect(result.items).toEqual(mockResponse.items);
    });

    it('handles empty search results', async () => {
      (apiCall as jest.Mock).mockResolvedValueOnce([]);

      const result = await StoresService.searchStores();

      expect(result.items).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('getStoreById', () => {
    it('fetches store by ID successfully', async () => {
      const mockStore = {
        id: '123',
        name: 'Test Store',
        address: '123 Main St',
        partner: { id: 'p1', name: 'Partner 1' },
      };

      (apiCall as jest.Mock).mockResolvedValueOnce(mockStore);

      const result = await StoresService.getStoreById('123');

      expect(apiCall).toHaveBeenCalledWith(
        '/stores/123',
        expect.any(Object),
        0,
        expect.any(String)
      );
      expect(result).toEqual(mockStore);
    });

    it('throws error when ID is missing', async () => {
      await expect(StoresService.getStoreById('')).rejects.toThrow('Store ID requis');
    });
  });
});

