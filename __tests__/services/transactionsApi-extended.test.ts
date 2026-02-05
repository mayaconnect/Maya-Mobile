/**
 * Tests supplémentaires pour features/home/services/transactionsApi.ts
 */

import { TransactionsApi } from '@/features/home/services/transactionsApi';
import { ApiClient } from '@/services/shared/api-client';

jest.mock('@/services/shared/api-client');
jest.mock('@/services/auth.service', () => ({
  API_BASE_URL: 'https://api.example.com/api/v1',
}));

describe('TransactionsApi - Tests étendus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPartnerTransactions', () => {
    it('devrait construire les paramètres de requête correctement', async () => {
      const mockResponse = { items: [], totalCount: 0 };
      (ApiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      await TransactionsApi.getPartnerTransactions('partner-1', {
        page: 1,
        pageSize: 10,
        storeId: 'store-1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(ApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('partner/partner-1'),
        expect.any(Object)
      );
      const callArgs = (ApiClient.get as jest.Mock).mock.calls[0][0];
      expect(callArgs).toContain('page=1');
      expect(callArgs).toContain('pageSize=10');
      expect(callArgs).toContain('storeId=store-1');
    });

    it('devrait gérer une réponse en tableau', async () => {
      const mockResponse = [{ id: 1 }, { id: 2 }];
      (ApiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await TransactionsApi.getPartnerTransactions('partner-1');

      expect(result.items).toEqual(mockResponse);
      expect(result.totalCount).toBe(2);
    });

    it('devrait gérer une réponse avec structure items', async () => {
      const mockResponse = {
        items: [{ id: 1 }],
        page: 1,
        pageSize: 10,
        totalCount: 1,
      };
      (ApiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await TransactionsApi.getPartnerTransactions('partner-1');

      expect(result).toEqual(mockResponse);
    });

    it('devrait retourner un tableau vide si la réponse est invalide', async () => {
      (ApiClient.get as jest.Mock).mockResolvedValue({});

      const result = await TransactionsApi.getPartnerTransactions('partner-1');

      expect(result.items).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it('devrait lancer une erreur si partnerId est manquant', async () => {
      await expect(
        TransactionsApi.getPartnerTransactions('')
      ).rejects.toThrow('Partner ID requis');
    });
  });

  describe('getUserTransactions', () => {
    it('devrait construire les paramètres de requête correctement', async () => {
      const mockResponse = { items: [], totalCount: 0 };
      (ApiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      await TransactionsApi.getUserTransactions('user-1', {
        page: 1,
        pageSize: 20,
      });

      expect(ApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('user/user-1'),
        expect.any(Object)
      );
    });

    it('devrait lancer une erreur si userId est manquant', async () => {
      await expect(
        TransactionsApi.getUserTransactions('')
      ).rejects.toThrow('User ID requis');
    });
  });
});

