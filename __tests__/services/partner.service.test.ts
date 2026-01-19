import { AuthService } from '@/services/auth.service';
import { PartnerService } from '@/services/partner.service';

jest.mock('@/services/auth.service', () => ({
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://fc554a95db2c.ngrok-free.app/api/v1',
  AuthService: {
    getAccessToken: jest.fn(),
  },
}));

describe('PartnerService', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    (AuthService.getAccessToken as jest.Mock).mockResolvedValue('test-token');
  });

  describe('getPartners', () => {
    it('fetches partners without filters', async () => {
      const mockPartners = {
        items: [{ id: '1', name: 'Partner 1' }, { id: '2', name: 'Partner 2' }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockPartners),
      } as Response);

      const result = await PartnerService.getPartners();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/partners'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
      expect(result.items).toHaveLength(2);
    });

    it('fetches partners with query parameters', async () => {
      const mockResponse = [{ id: '1', name: 'Partner 1' }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await PartnerService.getPartners({
        name: 'Test',
        page: 1,
        pageSize: 10,
        isActive: true,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/partners\?.*name=Test.*page=1.*pageSize=10.*isActive=true/),
        expect.any(Object)
      );
      expect(result.items).toEqual(mockResponse);
    });

    it('handles array response format', async () => {
      const arrayResponse = [{ id: '1' }, { id: '2' }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(arrayResponse),
      } as Response);

      const result = await PartnerService.getPartners({ page: 1 });

      expect(result.items).toEqual(arrayResponse);
      expect(result.page).toBe(1);
    });

    it('handles empty results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve([]),
      } as Response);

      const result = await PartnerService.getPartners();

      expect(result.items).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('getPartnerById', () => {
    it('fetches a partner by ID', async () => {
      const mockPartner = { id: '123', name: 'Test Partner' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockPartner),
      } as Response);

      const result = await PartnerService.getPartnerById('123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/partners/123'),
        expect.any(Object)
      );
      expect(result).toEqual(mockPartner);
    });

    it('throws error when ID is missing', async () => {
      await expect(PartnerService.getPartnerById('')).rejects.toThrow('Partner ID requis');
    });

    it('throws error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
        text: () => Promise.resolve('Partner not found'),
      } as Response);

      await expect(PartnerService.getPartnerById('nonexistent')).rejects.toThrow();
    });
  });
});

