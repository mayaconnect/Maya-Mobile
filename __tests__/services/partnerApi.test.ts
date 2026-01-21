/**
 * Tests pour PartnerApi
 */

import { PartnerApi } from '@/features/partners/services/partnerApi';
import { ApiClient } from '@/services/shared/api-client';

jest.mock('@/services/shared/api-client');
jest.mock('@/services/auth/auth.config', () => ({
  API_BASE_URL: 'https://api.example.com/api/v1',
}));

describe('PartnerApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPartners', () => {
    it('devrait retourner une liste de partenaires', async () => {
      const mockResponse = {
        items: [
          { id: '1', name: 'Partner 1' },
          { id: '2', name: 'Partner 2' },
        ],
        totalCount: 2,
      };

      (ApiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await PartnerApi.getPartners();

      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(ApiClient.get).toHaveBeenCalledWith(
        '/partners',
        expect.objectContaining({
          baseUrlOverride: expect.any(String),
        })
      );
    });

    it('devrait gérer les filtres de recherche', async () => {
      const mockResponse = { items: [], totalCount: 0 };

      (ApiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      await PartnerApi.getPartners({
        name: 'test',
        page: 1,
        pageSize: 10,
      });

      expect(ApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('name=test'),
        expect.any(Object)
      );
    });
  });

  describe('getPartnerById', () => {
    it('devrait retourner un partenaire par son ID', async () => {
      const mockPartner = { id: '1', name: 'Partner 1' };

      (ApiClient.get as jest.Mock).mockResolvedValue(mockPartner);

      const result = await PartnerApi.getPartnerById('1');

      expect(result).toEqual(mockPartner);
      expect(ApiClient.get).toHaveBeenCalledWith(
        '/partners/1',
        expect.any(Object)
      );
    });

    it('devrait lancer une erreur si l\'ID est manquant', async () => {
      await expect(PartnerApi.getPartnerById('')).rejects.toThrow('Partner ID requis');
    });
  });
});

