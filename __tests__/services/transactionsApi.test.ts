/**
 * Tests pour TransactionsApi
 */

import { TransactionsApi } from '@/features/home/services/transactionsApi';
import { ApiClient } from '@/services/shared/api-client';

jest.mock('@/services/shared/api-client');
jest.mock('@/services/auth/auth.config', () => ({
  API_BASE_URL: 'https://api.example.com/api/v1',
}));

describe('TransactionsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserTransactions', () => {
    it('devrait retourner les transactions d\'un utilisateur', async () => {
      const mockResponse = {
        items: [
          { id: '1', amount: 100 },
          { id: '2', amount: 200 },
        ],
        totalCount: 2,
      };

      (ApiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await TransactionsApi.getUserTransactions('user-1', {
        page: 1,
        pageSize: 10,
      });

      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(ApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/transactions/user/user-1'),
        expect.any(Object)
      );
    });

    it('devrait lancer une erreur si l\'ID utilisateur est manquant', async () => {
      await expect(
        TransactionsApi.getUserTransactions('', {})
      ).rejects.toThrow('User ID requis');
    });
  });

  describe('getUserSavingsByCategory', () => {
    it('devrait retourner les économies par catégorie', async () => {
      const mockResponse = [
        { category: 'Restaurant', totalSavings: 50, transactionCount: 5 },
        { category: 'Shopping', totalSavings: 30, transactionCount: 3 },
      ];

      (ApiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await TransactionsApi.getUserSavingsByCategory('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].category).toBe('Restaurant');
      expect(result[0].totalSavings).toBe(50);
    });
  });
});

