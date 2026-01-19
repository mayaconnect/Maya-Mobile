import { AuthService } from '@/services/auth.service';
import { apiCall } from '@/services/shared/api';
import { TransactionsService } from '@/services/transactions.service';

jest.mock('@/services/auth.service', () => ({
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://fc554a95db2c.ngrok-free.app/api/v1',
  AuthService: {
    getAccessToken: jest.fn(),
  },
}));

jest.mock('@/services/shared/api');

describe('TransactionsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AuthService.getAccessToken as jest.Mock).mockResolvedValue('test-token');
  });

  describe('getPartnerTransactions', () => {
    it('fetches partner transactions with filters', async () => {
      const mockResponse = {
        items: [{ id: '1', amount: 100 }],
        page: 1,
        pageSize: 10,
        totalCount: 1,
      };

      (apiCall as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await TransactionsService.getPartnerTransactions('partner1', {
        page: 1,
        pageSize: 10,
      });

      expect(apiCall).toHaveBeenCalledWith(
        expect.stringMatching(/\/transactions\/partner\/partner1/),
        expect.any(Object),
        0,
        expect.any(String)
      );
      expect(result.items).toEqual(mockResponse.items);
    });

    it('throws error when partnerId is missing', async () => {
      await expect(TransactionsService.getPartnerTransactions('', {})).rejects.toThrow(
        'Partner ID requis'
      );
    });
  });

  describe('getUserTransactions', () => {
    it('fetches user transactions successfully', async () => {
      const mockTransactions = [{ id: '1' }, { id: '2' }];

      (apiCall as jest.Mock).mockResolvedValueOnce(mockTransactions);

      const result = await TransactionsService.getUserTransactions('user1', {
        page: 1,
        pageSize: 20,
      });

      expect(apiCall).toHaveBeenCalledWith(
        expect.stringMatching(/\/transactions\/user\/user1/),
        expect.any(Object),
        0,
        expect.any(String)
      );
      expect(result.items).toEqual(mockTransactions);
    });

    it('throws error when userId is missing', async () => {
      await expect(TransactionsService.getUserTransactions('', {})).rejects.toThrow(
        'User ID requis'
      );
    });
  });

  describe('getStoreScanCount', () => {
    it('returns scan count as number', async () => {
      (apiCall as jest.Mock).mockResolvedValueOnce(42);

      const result = await TransactionsService.getStoreScanCount('store1');

      expect(result).toBe(42);
    });

    it('returns scan count from object response', async () => {
      (apiCall as jest.Mock).mockResolvedValueOnce({ count: 25 });

      const result = await TransactionsService.getStoreScanCount('store1', '2024-01-01');

      expect(result).toBe(25);
    });

    it('throws error when storeId is missing', async () => {
      await expect(TransactionsService.getStoreScanCount('')).rejects.toThrow('Store ID requis');
    });
  });

  describe('getScanCount', () => {
    it('returns count as string', async () => {
      (apiCall as jest.Mock).mockResolvedValueOnce('50');

      const result = await TransactionsService.getScanCount('partner1');

      expect(result).toBe('50');
    });

    it('converts number response to string', async () => {
      (apiCall as jest.Mock).mockResolvedValueOnce(100);

      const result = await TransactionsService.getScanCount('partner1', 'store1');

      expect(result).toBe('100');
    });

    it('extracts count from object response', async () => {
      (apiCall as jest.Mock).mockResolvedValueOnce({ count: 75 });

      const result = await TransactionsService.getScanCount('partner1', 'store1', '2024-01-01');

      expect(result).toBe('75');
    });
  });

  describe('getFilteredTransactions', () => {
    it('fetches filtered transactions with all parameters', async () => {
      const filters = {
        partnerId: 'p1',
        storeId: 's1',
        customerUserId: 'u1',
        page: 1,
        pageSize: 20,
      };

      const mockResponse = {
        items: [{ id: '1' }],
        page: 1,
        pageSize: 20,
        totalCount: 1,
      };

      (apiCall as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await TransactionsService.getFilteredTransactions(filters);

      expect(result.items).toEqual(mockResponse.items);
      expect(apiCall).toHaveBeenCalledWith(
        expect.stringMatching(/\/transactions\/filtered\?/),
        expect.any(Object),
        0,
        expect.any(String)
      );
    });
  });

  describe('getUserSavings', () => {
    it('returns savings as number', async () => {
      (apiCall as jest.Mock).mockResolvedValueOnce(150.5);

      const result = await TransactionsService.getUserSavings('user1', 'month');

      expect(result).toBe(150.5);
    });

    it('extracts savings from object response', async () => {
      (apiCall as jest.Mock).mockResolvedValueOnce({ savings: 200 });

      const result = await TransactionsService.getUserSavings('user1', 'year');

      expect(result).toBe(200);
    });

    it('throws error when userId is missing', async () => {
      await expect(TransactionsService.getUserSavings('', 'month')).rejects.toThrow(
        'User ID requis'
      );
    });

    it('throws error for invalid period', async () => {
      await expect(TransactionsService.getUserSavings('user1', 'invalid' as any)).rejects.toThrow(
        'Période invalide'
      );
    });
  });

  describe('getUserSavingsByCategory', () => {
    it('returns savings by category from array response', async () => {
      const mockResponse = [
        { category: 'Food', totalSavings: 50, transactionCount: 5 },
        { category: 'Shopping', totalSavings: 100, transactionCount: 10 },
      ];

      (apiCall as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await TransactionsService.getUserSavingsByCategory('user1');

      expect(result).toHaveLength(2);
      expect(result[0].category).toBe('Food');
      expect(result[0].totalSavings).toBe(50);
    });

    it('handles response with data property', async () => {
      const mockResponse = {
        data: [{ category: 'Food', amount: 30, transactionCount: 3 }],
      };

      (apiCall as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await TransactionsService.getUserSavingsByCategory('user1');

      expect(result).toHaveLength(1);
      expect(result[0].totalSavings).toBe(30);
    });

    it('returns empty array on invalid response', async () => {
      (apiCall as jest.Mock).mockResolvedValueOnce({});

      const result = await TransactionsService.getUserSavingsByCategory('user1');

      expect(result).toEqual([]);
    });

    it('throws error when userId is missing', async () => {
      await expect(TransactionsService.getUserSavingsByCategory('')).rejects.toThrow(
        'User ID requis'
      );
    });
  });
});

